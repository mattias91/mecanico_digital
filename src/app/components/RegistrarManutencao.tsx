'use client';

import { useState } from 'react';
import { Wrench, ArrowLeft, Calendar, DollarSign } from 'lucide-react';
import { TipoManutencao, NOMES_MANUTENCAO } from '@/lib/types';

interface RegistrarManutencaoProps {
  kmAtual: number;
  onRegistrar: (manutencao: {
    tipo: TipoManutencao;
    data: string;
    km: number;
    custo: number;
    oficina?: string;
    anotacao?: string;
    arquivo_url?: string;
  }) => void;
  onVoltar: () => void;
}

export default function RegistrarManutencao({ kmAtual, onRegistrar, onVoltar }: RegistrarManutencaoProps) {
  const [tipo, setTipo] = useState<TipoManutencao>('oleo');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [km, setKm] = useState(kmAtual.toString());
  const [custo, setCusto] = useState('');
  const [oficina, setOficina] = useState('');
  const [anotacao, setAnotacao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data && km && custo) {
      onRegistrar({
        tipo,
        data,
        km: parseInt(km),
        custo: parseFloat(custo),
        oficina: oficina || undefined,
        anotacao: anotacao || undefined,
      });
    }
  };

  const tiposManutencao: TipoManutencao[] = [
    'oleo', 'pastilha', 'filtro', 'pneu', 'revisao', 'arrefecimento', 'correia_dentada', 'corrente_comando'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={onVoltar}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">Registrar Manutenção</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Manutenção */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Manutenção
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoManutencao)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tiposManutencao.map((tipoOpcao) => (
                  <option key={tipoOpcao} value={tipoOpcao}>
                    {NOMES_MANUTENCAO[tipoOpcao]}
                  </option>
                ))}
              </select>
            </div>

            {/* Data e KM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Manutenção
                </label>
                <input
                  type="date"
                  id="data"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="km" className="block text-sm font-medium text-gray-700 mb-2">
                  Quilometragem
                </label>
                <input
                  type="number"
                  id="km"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 45000"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Custo e Oficina */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="custo" className="block text-sm font-medium text-gray-700 mb-2">
                  Custo (R$)
                </label>
                <input
                  type="number"
                  id="custo"
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 250.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label htmlFor="oficina" className="block text-sm font-medium text-gray-700 mb-2">
                  Oficina (opcional)
                </label>
                <input
                  type="text"
                  id="oficina"
                  value={oficina}
                  onChange={(e) => setOficina(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome da oficina"
                />
              </div>
            </div>

            {/* Anotação */}
            <div>
              <label htmlFor="anotacao" className="block text-sm font-medium text-gray-700 mb-2">
                Anotações (opcional)
              </label>
              <textarea
                id="anotacao"
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva os serviços realizados..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <Wrench className="h-5 w-5 mr-2" />
              Registrar Manutenção
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}