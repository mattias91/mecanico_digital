'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  saveServiceRecord, 
  savePendingLocal, 
  applySingleRecordUpdate,
  getServiceRecords 
} from '@/lib/serviceRecordsStorage';

interface PaginaRegistrarManutencaoProps {
  vehicleId: string;
  currentOdometer: number;
  onVoltar: () => void;
  onRefreshData?: () => void;
}

interface ItemManutencao {
  id: string;
  maintenance_item_key: string;
  odometer_at_service: number;
  service_date: string;
  interval_used_km: number;
  cost: number;
  notes: string;
}

const TIPOS_MANUTENCAO = [
  { key: 'oil', name: 'Óleo' },
  { key: 'brake_pad', name: 'Pastilhas' },
  { key: 'filter', name: 'Filtros' },
  { key: 'tire', name: 'Pneus' },
  { key: 'inspection', name: 'Revisão' },
  { key: 'coolant', name: 'Arrefecimento' },
  { key: 'timing_belt', name: 'Correia Dentada' },
  { key: 'timing_chain', name: 'Corrente Comando' },
];

export default function PaginaRegistrarManutencao({
  vehicleId,
  currentOdometer,
  onVoltar,
  onRefreshData,
}: PaginaRegistrarManutencaoProps) {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemManutencao[]>([
    {
      id: `item_${Date.now()}`,
      maintenance_item_key: 'oil',
      odometer_at_service: currentOdometer,
      service_date: new Date().toISOString().split('T')[0],
      interval_used_km: 10000,
      cost: 0,
      notes: '',
    },
  ]);
  const [salvando, setSalvando] = useState(false);

  const adicionarItem = () => {
    setItens([
      ...itens,
      {
        id: `item_${Date.now()}`,
        maintenance_item_key: 'oil',
        odometer_at_service: currentOdometer,
        service_date: new Date().toISOString().split('T')[0],
        interval_used_km: 10000,
        cost: 0,
        notes: '',
      },
    ]);
  };

  const removerItem = (id: string) => {
    if (itens.length === 1) {
      toast({
        title: 'Atenção',
        description: 'Você precisa ter pelo menos um item para registrar.',
        variant: 'destructive',
      });
      return;
    }
    setItens(itens.filter((item) => item.id !== id));
  };

  const atualizarItem = (id: string, campo: keyof ItemManutencao, valor: any) => {
    setItens(
      itens.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  };

  const salvarRegistros = async () => {
    // Validação básica
    for (const item of itens) {
      if (!item.maintenance_item_key || !item.odometer_at_service || !item.service_date) {
        toast({
          title: 'Erro de validação',
          description: 'Todos os campos obrigatórios devem ser preenchidos.',
          variant: 'destructive',
        });
        return;
      }

      if (item.odometer_at_service < 0) {
        toast({
          title: 'Erro de validação',
          description: 'A quilometragem não pode ser negativa.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSalvando(true);

    try {
      let salvos = 0;
      let locais = 0;

      for (const item of itens) {
        // Criar payload
        const payload = {
          maintenance_item_key: item.maintenance_item_key,
          odometer_at_service: item.odometer_at_service,
          service_date: item.service_date,
          interval_used_km: item.interval_used_km || undefined,
          notes: item.notes || undefined,
          cost: item.cost,
        };

        // Usar saveServiceRecord que retorna o registro salvo
        const result = await saveServiceRecord(payload, vehicleId);

        if (result) {
          if (result.synced) {
            salvos++;
            console.log(`✅ ${item.maintenance_item_key} salvo no Supabase`);
          } else {
            locais++;
            console.log(`💾 ${item.maintenance_item_key} salvo localmente`);
          }
        }
      }

      // Mensagens de feedback
      if (salvos > 0) {
        toast({
          title: 'Registros salvos',
          description: `${salvos} registro(s) salvo(s) com sucesso!`,
        });
      }

      if (locais > 0) {
        toast({
          title: 'Salvo localmente',
          description: `${locais} registro(s) salvo(s) localmente. Serão sincronizados automaticamente.`,
        });
      }

      if (salvos > 0 || locais > 0) {
        // Aguardar 1 segundo e voltar ao dashboard
        setTimeout(() => {
          onVoltar();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao salvar registros:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar os registros. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onVoltar}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Registrar Manutenção
          </h2>
        </div>
        <Button
          onClick={salvarRegistros}
          disabled={salvando}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {salvando ? 'Salvando...' : 'Salvar Tudo'}
        </Button>
      </div>

      {/* Aviso sobre campo cost */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Informação sobre custos
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Os custos são salvos localmente no navegador. Para persistência permanente no banco de dados, 
              a coluna <code className="bg-yellow-100 px-1 rounded">cost</code> precisa ser adicionada à tabela 
              <code className="bg-yellow-100 px-1 rounded">service_records</code> no Supabase.
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de Itens */}
      <div className="space-y-4">
        {itens.map((item, index) => (
          <Card key={item.id} className="p-4 sm:p-5 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Item {index + 1}
              </h3>
              {itens.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removerItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo de Manutenção */}
              <div>
                <Label htmlFor={`tipo-${item.id}`} className="text-xs sm:text-sm">
                  Tipo de Manutenção *
                </Label>
                <select
                  id={`tipo-${item.id}`}
                  value={item.maintenance_item_key}
                  onChange={(e) =>
                    atualizarItem(item.id, 'maintenance_item_key', e.target.value)
                  }
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIPOS_MANUTENCAO.map((tipo) => (
                    <option key={tipo.key} value={tipo.key}>
                      {tipo.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quilometragem */}
              <div>
                <Label htmlFor={`km-${item.id}`} className="text-xs sm:text-sm">
                  Quilometragem da Troca *
                </Label>
                <Input
                  id={`km-${item.id}`}
                  type="number"
                  value={item.odometer_at_service}
                  onChange={(e) =>
                    atualizarItem(
                      item.id,
                      'odometer_at_service',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                  placeholder="Ex: 45000"
                />
              </div>

              {/* Data do Serviço */}
              <div>
                <Label htmlFor={`data-${item.id}`} className="text-xs sm:text-sm">
                  Data do Serviço *
                </Label>
                <Input
                  id={`data-${item.id}`}
                  type="date"
                  value={item.service_date}
                  onChange={(e) =>
                    atualizarItem(item.id, 'service_date', e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              {/* Intervalo Utilizado */}
              <div>
                <Label htmlFor={`intervalo-${item.id}`} className="text-xs sm:text-sm">
                  Intervalo Utilizado (km)
                </Label>
                <Input
                  id={`intervalo-${item.id}`}
                  type="number"
                  value={item.interval_used_km}
                  onChange={(e) =>
                    atualizarItem(
                      item.id,
                      'interval_used_km',
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                  placeholder="Ex: 10000"
                />
              </div>

              {/* Custo */}
              <div>
                <Label htmlFor={`custo-${item.id}`} className="text-xs sm:text-sm">
                  Valor Gasto (R$)
                </Label>
                <Input
                  id={`custo-${item.id}`}
                  type="number"
                  step="0.01"
                  value={item.cost}
                  onChange={(e) =>
                    atualizarItem(
                      item.id,
                      'cost',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                  placeholder="Ex: 150.00"
                />
              </div>

              {/* Observações */}
              <div className="sm:col-span-2">
                <Label htmlFor={`obs-${item.id}`} className="text-xs sm:text-sm">
                  Observações
                </Label>
                <Textarea
                  id={`obs-${item.id}`}
                  value={item.notes}
                  onChange={(e) =>
                    atualizarItem(item.id, 'notes', e.target.value)
                  }
                  className="mt-1"
                  placeholder="Ex: Troca feita na oficina X"
                  rows={2}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Botão Adicionar Item */}
      <Button
        onClick={adicionarItem}
        variant="outline"
        className="w-full border-dashed border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Outro Item
      </Button>

      {/* Botão Salvar (mobile) */}
      <div className="sm:hidden">
        <Button
          onClick={salvarRegistros}
          disabled={salvando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {salvando ? 'Salvando...' : 'Salvar Tudo'}
        </Button>
      </div>
    </div>
  );
}
