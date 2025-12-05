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

type Tela = 'login' | 'cadastro-veiculo' | 'app';

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
    
    // Se Supabase não está configurado, ir direto para login
    if (!isSupabaseConfigured) {
      setTelaAtual('login');
      setCarregando(false);
      return;
    }

    try {
      const resultado = await verificarSessao();
      
      if (resultado.success && resultado.usuario) {
        setUsuario(resultado.usuario);
        // ✅ CORREÇÃO: Recarregar TODOS os dados do Supabase ao fazer login
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

  // ✅ CORREÇÃO: Função para recarregar dados do Supabase (sincronização entre dispositivos)
  const carregarDadosUsuario = async (idUsuario: string) => {
    try {
      console.log('🔄 Carregando dados do Supabase para usuário:', idUsuario);

      // Carregar veículo
      const resultadoVeiculo = await buscarVeiculoDoUsuario(idUsuario);
      
      if (resultadoVeiculo.success && resultadoVeiculo.veiculo) {
        setVeiculo(resultadoVeiculo.veiculo);
        console.log('✅ Veículo carregado:', resultadoVeiculo.veiculo.id);
        
        // Carregar manutenções
        const resultadoManutencoes = await buscarManutencoes(resultadoVeiculo.veiculo.id);
        if (resultadoManutencoes.success) {
          setManutencoes(resultadoManutencoes.manutencoes);
          console.log('✅ Manutenções carregadas:', resultadoManutencoes.manutencoes.length);
        }
        
        // Carregar intervalos
        const resultadoIntervalos = await buscarIntervalos(idUsuario);
        if (resultadoIntervalos.success) {
          setIntervalos(resultadoIntervalos.intervalos);
          console.log('✅ Intervalos carregados');
        }
        
        setTelaAtual('app');
      } else {
        console.log('ℹ️ Nenhum veículo cadastrado - redirecionando para cadastro');
        setTelaAtual('cadastro-veiculo');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
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

  // ✅ CORREÇÃO: Handler de Login - recarregar dados do Supabase
  const handleLogin = async (id: string, email: string, nome: string) => {
    console.log('🔐 Login realizado - carregando dados do Supabase...');
    setUsuario({ id, email, nome });
    setCarregando(true);
    // Recarregar TODOS os dados do Supabase ao fazer login
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
        console.log('✅ Veículo cadastrado no Supabase:', resultado.veiculo.id);
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

  // ✅ CORREÇÃO: Handler de Atualizar KM - salvar no Supabase
  const handleAtualizarKm = async (novoKm: number) => {
    if (!veiculo) return;

    console.log('📝 Atualizando KM no Supabase:', novoKm);
    const resultado = await atualizarVeiculo(veiculo.id, { km_atual: novoKm });
    
    if (resultado.success && resultado.veiculo) {
      setVeiculo(resultado.veiculo);
      console.log('✅ KM atualizado no Supabase');
      // Forçar recálculo de alertas
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // ✅ CORREÇÃO: Handler de Registrar Manutenção - salvar no Supabase
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
    
    console.log('📝 Salvando manutenção no Supabase...');
    const resultado = await salvarManutencao(novaManutencao);
    
    if (resultado.success && resultado.manutencao) {
      setManutencoes([...manutencoes, resultado.manutencao]);
      console.log('✅ Manutenção salva no Supabase:', resultado.manutencao.id);
      // Forçar recálculo de alertas
      setRefreshTrigger(prev => prev + 1);
    }
  };

  // Handler: Forçar refresh dos dados (chamado após salvar service_record)
  const handleRefreshData = () => {
    console.log('🔄 Forçando refresh dos dados...');
    setRefreshTrigger(prev => prev + 1);
  };

  // ✅ CORREÇÃO: Handler de Salvar Configurações - salvar no Supabase
  const handleSalvarConfiguracoes = async (
    veiculoAtualizado: Omit<Veiculo, 'id' | 'id_usuario'>,
    intervalosAtualizados: IntervaloManutencao,
    notificacoes: boolean
  ) => {
    if (!veiculo || !usuario) return;

    console.log('📝 Salvando configurações no Supabase...');

    // Atualizar veículo
    const resultadoVeiculo = await atualizarVeiculo(veiculo.id, veiculoAtualizado);
    if (resultadoVeiculo.success && resultadoVeiculo.veiculo) {
      setVeiculo(resultadoVeiculo.veiculo);
      console.log('✅ Veículo atualizado no Supabase');
    }

    // Atualizar intervalos
    const resultadoIntervalos = await salvarIntervalos(usuario.id, intervalosAtualizados);
    if (resultadoIntervalos.success) {
      setIntervalos(intervalosAtualizados);
      console.log('✅ Intervalos atualizados no Supabase');
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
          <p className="text-gray-400">Carregando dados do Supabase...</p>
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
