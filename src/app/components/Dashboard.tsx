'use client';

import { Veiculo, Alerta, NOMES_MANUTENCAO, Manutencao } from '@/lib/types';
import { Car, Bike, Gauge, Plus, History, Settings, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TestComponent from './TestComponent';

interface DashboardProps {
  veiculo: Veiculo;
  alertas: Alerta[];
  manutencoes: Manutencao[];
  onAdicionarManutencao: () => void;
  onAtualizarKm: () => void;
  onVerHistorico: () => void;
  onConfiguracoes: () => void;
}

// Função para formatar números de forma consistente (sem locale)
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function Dashboard({
  veiculo,
  alertas,
  manutencoes,
  onAdicionarManutencao,
  onAtualizarKm,
  onVerHistorico,
  onConfiguracoes,
}: DashboardProps) {
  // Calcular estatísticas com verificações de segurança robustas
  const stats = useMemo(() => {
    // Garantir que manutencoes e alertas sejam arrays válidos
    const manutencoesSeguras = Array.isArray(manutencoes) ? manutencoes : [];
    const alertasSeguros = Array.isArray(alertas) ? alertas : [];

    const totalManutencoes = manutencoesSeguras.length;
    const totalCusto = manutencoesSeguras.reduce((sum, m) => sum + (m?.custo || 0), 0);
    const custoMedio = totalManutencoes > 0 ? totalCusto / totalManutencoes : 0;
    const alertasAtivos = alertasSeguros.filter(a => a?.status === 'atrasado' || a?.status === 'proximo').length;

    return {
      totalManutencoes,
      totalCusto,
      custoMedio,
      alertasAtivos,
    };
  }, [manutencoes, alertas]);

  // Dados para gráfico de custos por tipo
  const custosPorTipo = useMemo(() => {
    const tipos: { [key: string]: number } = {};
    (manutencoes || []).forEach(m => {
      if (m?.tipo && m?.custo) {
        tipos[m.tipo] = (tipos[m.tipo] || 0) + m.custo;
      }
    });
    return Object.entries(tipos).map(([tipo, custo]) => ({
      tipo: NOMES_MANUTENCAO[tipo as keyof typeof NOMES_MANUTENCAO] || tipo,
      custo,
    }));
  }, [manutencoes]);

  // Dados para gráfico de manutenções ao longo do tempo
  const manutencoesPorMes = useMemo(() => {
    const meses: { [key: string]: number } = {};
    (manutencoes || []).forEach(m => {
      if (m?.data) {
        const mes = new Date(m.data).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        meses[mes] = (meses[mes] || 0) + 1;
      }
    });
    return Object.entries(meses).map(([mes, quantidade]) => ({ mes, quantidade }));
  }, [manutencoes]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Componente de Teste */}
      <TestComponent />

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {veiculo?.tipo === 'carro' ? (
                <Car className="h-10 w-10 text-blue-600" />
              ) : (
                <Bike className="h-10 w-10 text-blue-600" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {veiculo?.marca || 'Marca'} {veiculo?.modelo || 'Modelo'}
                </h1>
                <p className="text-lg text-gray-600">
                  {veiculo?.ano || 'Ano'} • {formatNumber(veiculo?.km_atual || 0)} km
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onAtualizarKm}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Gauge className="h-5 w-5 mr-2" />
                Atualizar KM
              </button>
              <button
                onClick={onConfiguracoes}
                className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <History className="h-7 w-7 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Manutenções</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalManutencoes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-7 w-7 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Investido</p>
                <p className="text-3xl font-bold text-gray-900">R$ {stats.totalCusto.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="h-7 w-7 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Custo Médio</p>
                <p className="text-3xl font-bold text-gray-900">R$ {stats.custoMedio.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.alertasAtivos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Custos por Tipo */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custos por Tipo de Manutenção</h2>
            {custosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={custosPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="custo"
                  >
                    {custosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>

          {/* Gráfico de Manutenções por Mês */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manutenções por Mês</h2>
            {manutencoesPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={manutencoesPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de Alertas */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Próximas Manutenções</h2>
            </div>
            <div className="p-6">
              {Array.isArray(alertas) && alertas.length > 0 ? (
                <div className="space-y-4">
                  {alertas
                    .filter(alerta => alerta?.status !== 'ok')
                    .sort((a, b) => (a?.km_limite || 0) - (b?.km_limite || 0))
                    .slice(0, 5)
                    .map((alerta) => (
                      <div
                        key={alerta?.id || Math.random()}
                        className={`flex items-center justify-between p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
                          alerta?.status === 'atrasado'
                            ? 'border-red-500 bg-red-50 hover:bg-red-100'
                            : 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {NOMES_MANUTENCAO[alerta?.tipo_manutencao] || 'Manutenção'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatNumber(alerta?.km_limite || 0)} km
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              alerta?.status === 'atrasado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {alerta?.status === 'atrasado' ? 'Atrasado' : 'Próximo'}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            Faltam {formatNumber((alerta?.km_limite || 0) - (veiculo?.km_atual || 0))} km
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma manutenção pendente
                </p>
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Ações Rápidas</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={onAdicionarManutencao}
                  className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="h-6 w-6 mr-2" />
                  Registrar Manutenção
                </button>
                <button
                  onClick={onVerHistorico}
                  className="flex items-center justify-center px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <History className="h-6 w-6 mr-2" />
                  Ver Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
