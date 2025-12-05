'use client';

import { useState, useEffect } from 'react';
import Login from './components/Login';
import CadastroVeiculo from './components/CadastroVeiculo';
import DashboardPrincipal from './components/DashboardPrincipal';
import {
  Veiculo,
  Manutencao,
  Alerta,
  IntervaloManutencao,
  TipoManutencao,
  INTERVALOS_PADRAO,
} from '@/lib/types';
import { verificarSessao } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  buscarVeiculoDoUsuario,
  salvarVeiculo,
  atualizarVeiculo,
  buscarManutencoes,
  salvarManutencao,
  buscarIntervalos,
  salvarIntervalos,
} from '@/lib/database';
import { calcularAlertas } from '@/lib/maintenanceCalculations';
import { AlertCircle, Database } from 'lucide-react';

type Tela = 'login' | 'cadastro-veiculo' | 'app' | 'config-necessaria';

interface Usuario {
  id: string;
  email: string;
  nome: string;
}

export default function Home() {
  const [telaAtual, setTelaAtual] = useState<Tela>('login');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [intervalos, setIntervalos] = useState<IntervaloManutencao>(INTERVALOS_PADRAO);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Verificar sessão ao carregar
  useEffect(() => {
    verificarSessaoAtual();
  }, []);

  const verificarSessaoAtual = async () => {
    setCarregando(true);
    
    // Se Supabase não está configurado, mostrar tela de configuração
    if (!isSupabaseConfigured()) {
      setTelaAtual('config-necessaria');
      setCarregando(false);
      return;
    }

    try {
      const resultado = await verificarSessao();
      
      if (resultado.success && resultado.usuario) {
        setUsuario(resultado.usuario);
        await carregarDadosUsuario(resultado.usuario.id);
      } else {
        // Forçar tela de login se não houver sessão
        setTelaAtual('login');
        setCarregando(false);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      setTelaAtual('login');
      setCarregando(false);
    }
  };

  const carregarDadosUsuario = async (idUsuario: string) => {
    try {
      // Carregar veículo
      const resultadoVeiculo = await buscarVeiculoDoUsuario(idUsuario);
      
      if (resultadoVeiculo.success && resultadoVeiculo.veiculo) {
        setVeiculo(resultadoVeiculo.veiculo);
        
        // Carregar manutenções
        const resultadoManutencoes = await buscarManutencoes(resultadoVeiculo.veiculo.id);
        if (resultadoManutencoes.success) {
          setManutencoes(resultadoManutencoes.manutencoes);
        }
        
        // Carregar intervalos
        const resultadoIntervalos = await buscarIntervalos(idUsuario);
        if (resultadoIntervalos.success) {
          setIntervalos(resultadoIntervalos.intervalos);
        }
        
        setTelaAtual('app');
      } else {
        setTelaAtual('cadastro-veiculo');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setTelaAtual('cadastro-veiculo');
    } finally {
      setCarregando(false);
    }
  };

  // Recalcular alertas quando dados mudarem - USANDO NOVA LÓGICA ASSÍNCRONA
  useEffect(() => {
    if (veiculo) {
      const recalcularAlertas = async () => {
        const novosAlertas = await calcularAlertas(veiculo, intervalos);
        setAlertas(novosAlertas);
      };
      
      recalcularAlertas();
    }
  }, [veiculo, intervalos, refreshTrigger]);

  // Handler: Login
  const handleLogin = async (id: string, email: string, nome: string) => {
    setUsuario({ id, email, nome });
    setCarregando(true);
    await carregarDadosUsuario(id);
  };

  // Handler: Cadastro de Veículo - CORRIGIDO
  const handleCadastroVeiculo = async (veiculoData: Omit<Veiculo, 'id' | 'id_usuario'>) => {
    if (!usuario) {
      console.error('Usuário não encontrado');
      alert('Erro: Usuário não encontrado. Faça login novamente.');
      return;
    }

    const novoVeiculo = {
      id_usuario: usuario.id,
      ...veiculoData,
    };

    try {
      const resultado = await salvarVeiculo(novoVeiculo);
      
      if (resultado.success && resultado.veiculo) {
        // Sucesso: salvar veículo e ir para o app
        setVeiculo(resultado.veiculo);
        setTelaAtual('app');
      } else {
        // Erro ao salvar
        console.error('Erro ao salvar veículo:', resultado.error);
        throw new Error(resultado.error || 'Erro desconhecido ao salvar veículo');
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar veículo: ${error.message || 'Tente novamente.'}`);
      throw error; // Re-throw para o componente CadastroVeiculo tratar
    }
  };

  // Handler: Atualizar KM
  const handleAtualizarKm = async (novoKm: number) => {
    if (!veiculo) return;

    const resultado = await atualizarVeiculo(veiculo.id, { km_atual: novoKm });
    
    if (resultado.success && resultado.veiculo) {
      setVeiculo(resultado.veiculo);
      // Forçar recálculo de alertas
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Handler: Registrar Manutenção
  const handleRegistrarManutencao = async (manutencaoData: {
    tipo: TipoManutencao;
    data: string;
    km: number;
    custo: number;
    oficina?: string;
    anotacao?: string;
    arquivo_url?: string;
  }) => {
    if (!veiculo) return;

    const novaManutencao = {
      id_veiculo: veiculo.id,
      ...manutencaoData,
    };
    
    const resultado = await salvarManutencao(novaManutencao);
    
    if (resultado.success && resultado.manutencao) {
      setManutencoes([...manutencoes, resultado.manutencao]);
      // Forçar recálculo de alertas
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Handler: Forçar refresh dos dados (chamado após salvar service_record)
  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handler: Salvar Configurações
  const handleSalvarConfiguracoes = async (
    veiculoAtualizado: Omit<Veiculo, 'id' | 'id_usuario'>,
    intervalosAtualizados: IntervaloManutencao,
    notificacoes: boolean
  ) => {
    if (!veiculo || !usuario) return;

    // Atualizar veículo
    const resultadoVeiculo = await atualizarVeiculo(veiculo.id, veiculoAtualizado);
    if (resultadoVeiculo.success && resultadoVeiculo.veiculo) {
      setVeiculo(resultadoVeiculo.veiculo);
    }

    // Atualizar intervalos
    const resultadoIntervalos = await salvarIntervalos(usuario.id, intervalosAtualizados);
    if (resultadoIntervalos.success) {
      setIntervalos(intervalosAtualizados);
    }

    setNotificacoesAtivas(notificacoes);
    // Forçar recálculo de alertas
    setRefreshTrigger(prev => prev + 1);
  };

  // Tela de carregamento
  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de configuração necessária
  if (telaAtual === 'config-necessaria') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 rounded-full mb-4">
              <Database className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Configuração Necessária
            </h1>
            <p className="text-gray-400 text-sm">
              Este aplicativo precisa de configuração do banco de dados para funcionar
            </p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-orange-400 mb-2">
                  Banco de dados não configurado
                </p>
                <p className="text-gray-400">
                  Para usar este aplicativo, você precisa configurar as credenciais do Supabase.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-semibold mb-2 text-sm">
                Como configurar:
              </h3>
              <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse as Configurações do Projeto</li>
                <li>Vá em Integrações → Supabase</li>
                <li>Conecte sua conta do Supabase</li>
                <li>Recarregue esta página</li>
              </ol>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-xs">
                💡 <strong>Dica:</strong> Se você ainda não tem uma conta Supabase, 
                crie uma gratuitamente em{' '}
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-300"
                >
                  supabase.com
                </a>
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização condicional das telas
  if (telaAtual === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (telaAtual === 'cadastro-veiculo') {
    return <CadastroVeiculo onCadastro={handleCadastroVeiculo} usuario={usuario} />;
  }

  if (telaAtual === 'app' && veiculo && usuario) {
    return (
      <DashboardPrincipal
        usuario={usuario}
        veiculo={veiculo}
        alertas={alertas}
        manutencoes={manutencoes}
        intervalos={intervalos}
        notificacoesAtivas={notificacoesAtivas}
        onAtualizarKm={handleAtualizarKm}
        onRegistrarManutencao={handleRegistrarManutencao}
        onSalvarConfiguracoes={handleSalvarConfiguracoes}
        onRefreshData={handleRefreshData}
      />
    );
  }

  return null;
}
