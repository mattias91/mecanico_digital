'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Info, Plus } from 'lucide-react';
import { Veiculo, Alerta, Manutencao } from '@/lib/types';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import RegistrarTrocaModal from './RegistrarTrocaModal';
import AtualizarKm from './AtualizarKm';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getLastRecordsByKey, applySingleRecordUpdate, CardUpdateData, getServiceRecords } from '@/lib/serviceRecordsStorage';

interface PaginaDashboardProps {
  veiculo: Veiculo;
  alertas: Alerta[];
  manutencoes: Manutencao[];
  onAtualizarKm: (novoKm: number) => void;
  onAbrirPaginaRegistro?: () => void;
  onRefreshData?: () => void;
}

const NOMES_MANUTENCAO: Record<string, string> = {
  oleo: 'Óleo',
  pastilha: 'Pastilhas',
  filtro: 'Filtros',
  pneu: 'Pneus',
  revisao: 'Revisão',
  arrefecimento: 'Arrefecimento',
  correia_dentada: 'Correia Dentada',
  corrente_comando: 'Corrente Comando',
  oil: 'Óleo',
  brake_pad: 'Pastilhas',
  filter: 'Filtros',
  tire: 'Pneus',
  inspection: 'Revisão',
  coolant: 'Arrefecimento',
  timing_belt: 'Correia Dentada',
  timing_chain: 'Corrente Comando',
};

const CORES_STATUS = {
  ok: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  proximo: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: AlertTriangle },
  atrasado: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
  sem_registro: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: Info },
};

// Função helper para formatar números de forma consistente
const formatarNumero = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Função helper para formatar moeda
const formatarMoeda = (valor: number): string => {
  return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Função para calcular cor do mini dashboard (verde -> amarelo -> vermelho)
const calcularCorDashboard = (kmRestante: number, kmIntervalo: number): string => {
  const percentualRestante = (kmRestante / kmIntervalo) * 100;
  
  if (percentualRestante < 0) return '#ef4444'; // Vermelho (atrasado)
  if (percentualRestante <= 10) return '#f97316'; // Laranja escuro
  if (percentualRestante <= 20) return '#fb923c'; // Laranja
  if (percentualRestante <= 30) return '#fbbf24'; // Amarelo escuro
  if (percentualRestante <= 50) return '#fde047'; // Amarelo
  if (percentualRestante <= 70) return '#a3e635'; // Verde-amarelo
  return '#22c55e'; // Verde
};

export default function PaginaDashboard({ veiculo, alertas, manutencoes, onAtualizarKm, onAbrirPaginaRegistro, onRefreshData }: PaginaDashboardProps) {
  const [novoKm, setNovoKm] = useState(veiculo.km_atual.toString());
  const [modalAberto, setModalAberto] = useState(false);
  const [manutencaoSelecionada, setManutencaoSelecionada] = useState<{ key: string; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mostrarAtualizarKm, setMostrarAtualizarKm] = useState(false);
  
  // State para optimistic updates dos cards
  const [cardUpdates, setCardUpdates] = useState<Record<string, CardUpdateData>>({});
  
  // State para custos agregados dos service_records
  const [custosPorTipo, setCustosPorTipo] = useState<Record<string, number>>({});

  // Atualizar novoKm quando veiculo.km_atual mudar
  useEffect(() => {
    setNovoKm(veiculo.km_atual.toString());
  }, [veiculo.km_atual]);

  // Carregar custos dos service_records ao montar e quando houver mudanças
  useEffect(() => {
    const carregarCustos = async () => {
      try {
        const records = await getServiceRecords(veiculo.id);
        
        // Agregar custos por tipo de manutenção
        const custos: Record<string, number> = {};
        
        records.forEach(record => {
          if (record.cost && record.cost > 0) {
            const nomeManutencao = NOMES_MANUTENCAO[record.maintenance_item_key] || record.maintenance_item_key;
            custos[nomeManutencao] = (custos[nomeManutencao] || 0) + record.cost;
          }
        });
        
        setCustosPorTipo(custos);
      } catch (error) {
        console.error('Erro ao carregar custos:', error);
      }
    };
    
    carregarCustos();
  }, [veiculo.id, refreshKey]);

  // Subscrição Realtime para service_records com atualização granular
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user) return;

        // Subscrever a mudanças na tabela service_records filtrada por vehicle_id
        subscription = supabase
          .channel(`service_records:${veiculo.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'service_records',
              filter: `vehicle_id=eq.${veiculo.id}`,
            },
            async (payload) => {
              console.log('🔄 Mudança detectada em service_records:', payload);
              
              // Se for INSERT ou UPDATE, aplicar atualização granular
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const record = payload.new as any;
                
                // Aplicar atualização apenas no card afetado
                const cardUpdate = applySingleRecordUpdate(
                  {
                    ...record,
                    synced: true,
                  },
                  veiculo.km_atual
                );
                
                setCardUpdates(prev => ({
                  ...prev,
                  [record.maintenance_item_key]: cardUpdate,
                }));
                
                console.log(`✅ Card atualizado via Realtime: ${record.maintenance_item_key}`);
              }
              
              // Forçar re-render para recalcular alertas e custos
              setRefreshKey(prev => prev + 1);
            }
          )
          .subscribe();

        console.log('✅ Subscrição Realtime ativada para vehicle_id:', veiculo.id);
      } catch (error) {
        console.error('Erro ao configurar subscrição Realtime:', error);
      }
    };

    setupSubscription();

    // Cleanup
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
        console.log('🔌 Subscrição Realtime desconectada');
      }
    };
  }, [veiculo.id, veiculo.km_atual]);

  // Calcular estatísticas - INCLUIR TODOS os alertas
  const alertasComRegistro = alertas.filter((a) => !a.sem_registro);
  const alertasAtrasados = alertasComRegistro.filter((a) => a.status === 'atrasado').length;
  const alertasProximos = alertasComRegistro.filter((a) => a.status === 'proximo').length;
  const alertasOk = alertasComRegistro.filter((a) => a.status === 'ok').length;
  const alertasSemRegistro = alertas.filter((a) => a.sem_registro).length;
  
  // Calcular custo total dos service_records
  const custoTotal = Object.values(custosPorTipo).reduce((acc, custo) => acc + custo, 0);
  const custoMedio = Object.keys(custosPorTipo).length > 0 ? custoTotal / Object.keys(custosPorTipo).length : 0;

  // Dados para gráfico de custos por tipo (usando dados dos service_records)
  const dadosGraficoCustos = Object.entries(custosPorTipo)
    .map(([tipo, custo]) => ({ tipo, custo }))
    .sort((a, b) => b.custo - a.custo)
    .slice(0, 5);

  const handleAtualizarKm = () => {
    // Abrir componente AtualizarKm em vez de atualizar inline
    setMostrarAtualizarKm(true);
  };

  const handleConfirmarAtualizacaoKm = (novoKm: number) => {
    onAtualizarKm(novoKm);
    setMostrarAtualizarKm(false);
    // Forçar re-render para recalcular alertas
    setRefreshKey(prev => prev + 1);
  };

  // Mapear tipo de manutenção para maintenance_item_key
  const mapTipoToKey = (tipo: string): string => {
    const mapping: Record<string, string> = {
      'oleo': 'oil',
      'pastilha': 'brake_pad',
      'filtro': 'filter',
      'pneu': 'tire',
      'revisao': 'inspection',
      'arrefecimento': 'coolant',
      'correia_dentada': 'timing_belt',
      'corrente_comando': 'timing_chain',
    };
    return mapping[tipo] || tipo;
  };

  const handleAbrirModal = (tipoManutencao: string, maintenanceName: string) => {
    const maintenanceKey = mapTipoToKey(tipoManutencao);
    setManutencaoSelecionada({ key: maintenanceKey, name: maintenanceName });
    setModalAberto(true);
  };

  const handleSalvarRegistro = () => {
    // Forçar re-render para atualizar cálculos e custos
    setRefreshKey(prev => prev + 1);
  };

  // Aplicar optimistic updates aos alertas
  const alertasComUpdates = alertas.map(alerta => {
    const maintenanceKey = mapTipoToKey(alerta.tipo_manutencao);
    const cardUpdate = cardUpdates[maintenanceKey];
    
    if (cardUpdate) {
      // Aplicar dados do optimistic update
      return {
        ...alerta,
        km_ultimo: cardUpdate.last_service_km,
        km_limite: cardUpdate.next_due_km,
        remaining_km: cardUpdate.remaining_km,
        status: cardUpdate.synced ? cardUpdate.status : alerta.status,
        sem_registro: false,
      };
    }
    
    return alerta;
  });

  // Ordenar alertas: atrasados > próximos > ok > sem registro
  const alertasOrdenados = [...alertasComUpdates].sort((a, b) => {
    const prioridade = { atrasado: 0, proximo: 1, ok: 2 };
    if (a.sem_registro && !b.sem_registro) return 1;
    if (!a.sem_registro && b.sem_registro) return -1;
    if (a.sem_registro && b.sem_registro) return 0;
    return (prioridade[a.status] || 3) - (prioridade[b.status] || 3);
  });

  return (
    <>
      {mostrarAtualizarKm ? (
        <AtualizarKm
          kmAtual={veiculo.km_atual}
          vehicleId={veiculo.id}
          onAtualizar={handleConfirmarAtualizacaoKm}
          onVoltar={() => setMostrarAtualizarKm(false)}
        />
      ) : (
        <div className="space-y-4 sm:space-y-6" key={refreshKey}>
          {/* Cards de Estatísticas - Grid Responsivo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-white border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">KM Atual</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">
                    {formatarNumero(veiculo.km_atual)}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Atrasadas</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{alertasAtrasados}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Próximas</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{alertasProximos}</p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
            </Card>

            <Card className="p-3 sm:p-4 bg-white border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Gasto Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    R$ {formatarMoeda(custoTotal)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </Card>
          </div>

          {/* Atualizar KM - Compacto */}
          <Card className="p-4 sm:p-5 bg-white border-slate-200">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">Atualizar Quilometragem</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="km" className="text-xs sm:text-sm">Novo KM</Label>
                <Input
                  id="km"
                  type="number"
                  value={novoKm}
                  onChange={(e) => setNovoKm(e.target.value)}
                  className="mt-1"
                  placeholder="Ex: 45500"
                />
              </div>
              <Button 
                onClick={handleAtualizarKm} 
                className="sm:mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Atualizar
              </Button>
            </div>
          </Card>

          {/* Gráfico de Custos por Tipo - INTEGRADO COM SERVICE_RECORDS */}
          <Card className="p-4 sm:p-5 bg-white border-slate-200">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">
              Custos por Tipo
            </h3>
            {dadosGraficoCustos.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosGraficoCustos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${formatarMoeda(value)}`}
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="custo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
                Nenhum custo registrado ainda
              </div>
            )}
          </Card>

          {/* Status de TODAS as Manutenções com Mini Dashboards Integrados */}
          <Card className="p-4 sm:p-5 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Status de Todas as Manutenções
              </h3>
              <span className="text-xs text-slate-500">
                {alertas.length} {alertas.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alertasOrdenados.map((alerta) => {
                const statusKey = alerta.sem_registro ? 'sem_registro' : alerta.status;
                const config = CORES_STATUS[statusKey];
                const Icon = config.icon;
                const kmRestante = alerta.remaining_km || (alerta.km_limite - veiculo.km_atual);
                const kmIntervalo = alerta.km_limite - alerta.km_ultimo;
                
                // Calcular cor do mini dashboard
                const corDashboard = alerta.sem_registro 
                  ? '#94a3b8' 
                  : calcularCorDashboard(kmRestante, kmIntervalo);
                
                // Verificar se tem optimistic update pendente
                const maintenanceKey = mapTipoToKey(alerta.tipo_manutencao);
                const cardUpdate = cardUpdates[maintenanceKey];
                const isPending = cardUpdate && !cardUpdate.synced;

                return (
                  <div
                    key={alerta.id}
                    className={`flex flex-col p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow-md ${isPending ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className={`w-5 h-5 ${config.text} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${config.text}`}>
                              {NOMES_MANUTENCAO[alerta.tipo_manutencao]}
                            </p>
                            {isPending && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Salvo localmente
                              </span>
                            )}
                          </div>
                          
                          {alerta.sem_registro ? (
                            <p className="text-xs text-slate-600 mt-1">
                              Sem registro — informe quando foi a última troca
                            </p>
                          ) : (
                            <>
                              <p className="text-xs text-slate-700 mt-1 mb-1">
                                {alerta.status === 'atrasado' 
                                  ? `⚠️ Atrasado em ${formatarNumero(Math.abs(kmRestante))} km`
                                  : alerta.status === 'proximo'
                                  ? `⏰ Faltam ${formatarNumero(kmRestante)} km`
                                  : `✓ OK — Faltam ${formatarNumero(kmRestante)} km`
                                }
                              </p>
                              <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                                <span>Última: {formatarNumero(alerta.km_ultimo)} km</span>
                                <span>Próxima: {formatarNumero(alerta.km_limite)} km</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mini Dashboard + Botão */}
                    <div className="flex items-center gap-2 mt-2">
                      {/* Mini Dashboard Visual (Barra de Progresso) */}
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 ease-in-out"
                          style={{ 
                            width: alerta.sem_registro 
                              ? '0%' 
                              : `${Math.max(0, Math.min(100, (kmRestante / kmIntervalo) * 100))}%`,
                            backgroundColor: corDashboard
                          }}
                        />
                      </div>

                      {/* Botão de Registrar/Atualizar */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAbrirModal(alerta.tipo_manutencao, NOMES_MANUTENCAO[alerta.tipo_manutencao])}
                        className="text-xs h-8 flex-shrink-0"
                        style={{ 
                          borderColor: corDashboard,
                          color: corDashboard
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {alerta.sem_registro ? 'Registrar' : 'Atualizar'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Modal de Registrar Troca */}
          {manutencaoSelecionada && (
            <RegistrarTrocaModal
              isOpen={modalAberto}
              onClose={() => {
                setModalAberto(false);
                setManutencaoSelecionada(null);
              }}
              maintenanceKey={manutencaoSelecionada.key}
              maintenanceName={manutencaoSelecionada.name}
              currentOdometer={veiculo.km_atual}
              vehicleId={veiculo.id}
              onSave={handleSalvarRegistro}
              onOptimisticUpdate={(maintenanceKey, cardData) => {
                // Aplicar optimistic update apenas no card afetado
                setCardUpdates(prev => ({
                  ...prev,
                  [maintenanceKey]: cardData,
                }));
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
