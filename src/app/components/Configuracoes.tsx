'use client';

import { useState } from 'react';
import { Settings, ArrowLeft, Save } from 'lucide-react';
import { Veiculo, IntervaloManutencao, NOMES_MANUTENCAO, TipoManutencao } from '@/lib/types';

interface ConfiguracoesProps {
  veiculo: Veiculo;
  intervalos: IntervaloManutencao;
  notificacoesAtivas: boolean;
  onSalvar: (
    veiculo: Omit<Veiculo, 'id' | 'id_usuario'>,
    intervalos: IntervaloManutencao,
    notificacoes: boolean
  ) => void;
  onVoltar: () => void;
}

export default function Configuracoes({
  veiculo,
  intervalos,
  notificacoesAtivas,
  onSalvar,
  onVoltar
}: ConfiguracoesProps) {
  const [veiculoForm, setVeiculoForm] = useState({
    tipo: veiculo.tipo,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    ano: veiculo.ano.toString(),
    km_atual: veiculo.km_atual.toString(),
  });

  const [intervalosForm, setIntervalosForm] = useState<IntervaloManutencao>(intervalos);
  const [notificacoesForm, setNotificacoesForm] = useState(notificacoesAtivas);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(
      {
        tipo: veiculoForm.tipo,
        marca: veiculoForm.marca,
        modelo: veiculoForm.modelo,
        ano: parseInt(veiculoForm.ano),
        km_atual: parseInt(veiculoForm.km_atual),
      },
      intervalosForm,
      notificacoesForm
    );
  };

  const tiposManutencao: TipoManutencao[] = [
    'oleo', 'pastilha', 'filtro', 'pneu', 'revisao', 'arrefecimento', 'correia_dentada', 'corrente_comando'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={onVoltar}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Informações do Veículo */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Veículo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                  <input
                    type="text"
                    value={veiculoForm.marca}
                    onChange={(e) => setVeiculoForm({...veiculoForm, marca: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                  <input
                    type="text"
                    value={veiculoForm.modelo}
                    onChange={(e) => setVeiculoForm({...veiculoForm, modelo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                  <input
                    type="number"
                    value={veiculoForm.ano}
                    onChange={(e) => setVeiculoForm({...veiculoForm, ano: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quilometragem Atual</label>
                  <input
                    type="number"
                    value={veiculoForm.km_atual}
                    onChange={(e) => setVeiculoForm({...veiculoForm, km_atual: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Intervalos de Manutenção */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Intervalos de Manutenção (km)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tiposManutencao.map((tipo) => (
                  <div key={tipo}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {NOMES_MANUTENCAO[tipo]}
                    </label>
                    <input
                      type="number"
                      value={intervalosForm[tipo]}
                      onChange={(e) => setIntervalosForm({
                        ...intervalosForm,
                        [tipo]: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1000"
                      step="1000"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notificações */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notificações</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notificacoes"
                  checked={notificacoesForm}
                  onChange={(e) => setNotificacoesForm(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notificacoes" className="ml-2 text-sm text-gray-700">
                  Ativar notificações de manutenção
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}