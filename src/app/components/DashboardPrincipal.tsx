'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { LayoutDashboard, Wrench, Settings, FileText } from 'lucide-react';
import PaginaDashboard from './PaginaDashboard';
import PaginaManutencoes from './PaginaManutencoes';
import PaginaConfiguracoes from './PaginaConfiguracoes';
import PaginaNotasFiscais from './PaginaNotasFiscais';
import PaginaRegistrarManutencao from './PaginaRegistrarManutencao';
import PerfilUsuario from './PerfilUsuario';
import { Veiculo, Alerta, Manutencao, IntervaloManutencao, TipoManutencao } from '@/lib/types';

interface DashboardPrincipalProps {
  usuario: { id: string; email: string; nome: string };
  veiculo: Veiculo;
  alertas: Alerta[];
  manutencoes: Manutencao[];
  intervalos: IntervaloManutencao;
  notificacoesAtivas: boolean;
  onAtualizarKm: (novoKm: number) => void;
  onRegistrarManutencao: (manutencao: {
    tipo: TipoManutencao;
    data: string;
    km: number;
    custo: number;
    oficina?: string;
    anotacao?: string;
    arquivo_url?: string;
  }) => void;
  onSalvarConfiguracoes: (
    veiculo: Omit<Veiculo, 'id' | 'id_usuario'>,
    intervalos: IntervaloManutencao,
    notificacoes: boolean
  ) => void;
  onRefreshData?: () => void;
}

// Função helper para formatar números de forma consistente
const formatarNumero = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function DashboardPrincipal({
  usuario,
  veiculo,
  alertas,
  manutencoes,
  intervalos,
  notificacoesAtivas,
  onAtualizarKm,
  onRegistrarManutencao,
  onSalvarConfiguracoes,
  onRefreshData,
}: DashboardPrincipalProps) {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [mostrarPaginaRegistro, setMostrarPaginaRegistro] = useState(false);

  // Contar notas fiscais para badge
  const totalNotasFiscais = manutencoes.filter(m => m.arquivo_url).length;

  const handleVoltarDeRegistro = () => {
    setMostrarPaginaRegistro(false);
    // Forçar refresh dos dados ao voltar
    if (onRefreshData) {
      onRefreshData();
    }
  };

  // Se estiver na página de registro, mostrar apenas ela
  if (mostrarPaginaRegistro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <PaginaRegistrarManutencao
            vehicleId={veiculo.id}
            currentOdometer={veiculo.km_atual}
            onVoltar={handleVoltarDeRegistro}
            onRefreshData={onRefreshData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0F0F0F]">
      {/* Header Premium Dark - Simplificado */}
      <header className="bg-gradient-to-r from-[#1A1A1A] to-[#141414] border-b border-[#2A2A2A] sticky top-0 z-50 shadow-2xl backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Título */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#E8E8E8] to-[#A0A0A0] bg-clip-text text-transparent">
                Mecânico Digital
              </h1>
              <p className="text-xs sm:text-sm text-[#808080]">
                Gestão Inteligente de Manutenção
              </p>
            </div>

            {/* Ícone de Perfil */}
            <PerfilUsuario usuario={usuario} veiculo={veiculo} />
          </div>
        </div>
      </header>

      {/* Navegação por Abas - Premium Dark */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          {/* Tabs List - Dark Premium */}
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto p-1 bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm text-[#A0A0A0] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3B82F6] data-[state=active]:to-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all duration-300"
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Início</span>
            </TabsTrigger>
            <TabsTrigger 
              value="manutencoes" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm text-[#A0A0A0] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3B82F6] data-[state=active]:to-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all duration-300"
            >
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Manutenções</span>
              <span className="sm:hidden">Serviços</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notas-fiscais" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm text-[#A0A0A0] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3B82F6] data-[state=active]:to-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all duration-300 relative"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Notas Fiscais</span>
              <span className="sm:hidden">Notas</span>
              {totalNotasFiscais > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                  {totalNotasFiscais}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="configuracoes" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm text-[#A0A0A0] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3B82F6] data-[state=active]:to-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all duration-300"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Ajustes</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das Abas */}
          <TabsContent value="dashboard" className="mt-0">
            <PaginaDashboard
              veiculo={veiculo}
              alertas={alertas}
              manutencoes={manutencoes}
              onAtualizarKm={onAtualizarKm}
              onAbrirPaginaRegistro={() => setMostrarPaginaRegistro(true)}
              onRefreshData={onRefreshData}
            />
          </TabsContent>

          <TabsContent value="manutencoes" className="mt-0">
            <PaginaManutencoes
              veiculo={veiculo}
              manutencoes={manutencoes}
              onRegistrarManutencao={onRegistrarManutencao}
            />
          </TabsContent>

          <TabsContent value="notas-fiscais" className="mt-0">
            <PaginaNotasFiscais
              manutencoes={manutencoes}
            />
          </TabsContent>

          <TabsContent value="configuracoes" className="mt-0">
            <PaginaConfiguracoes
              veiculo={veiculo}
              intervalos={intervalos}
              notificacoesAtivas={notificacoesAtivas}
              onSalvar={onSalvarConfiguracoes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
