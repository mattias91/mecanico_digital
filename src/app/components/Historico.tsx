'use client';

import { useState } from 'react';
import { History, ArrowLeft, Calendar, DollarSign, Wrench } from 'lucide-react';
import { Manutencao, NOMES_MANUTENCAO } from '@/lib/types';

interface HistoricoProps {
  manutencoes: Manutencao[];
  onVoltar: () => void;
}

export default function Historico({ manutencoes, onVoltar }: HistoricoProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const manutencoesFiltradas = manutencoes.filter(m =>
    filtroTipo === 'todos' || m.tipo === filtroTipo
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const tiposUnicos = ['todos', ...Array.from(new Set(manutencoes.map(m => m.tipo)))];

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
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Manutenções</h1>
              </div>
              <History className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="p-6">
            {/* Filtro */}
            <div className="mb-6">
              <label htmlFor="filtro" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por tipo
              </label>
              <select
                id="filtro"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo === 'todos' ? 'Todas as manutenções' : NOMES_MANUTENCAO[tipo as keyof typeof NOMES_MANUTENCAO]}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de Manutenções */}
            {manutencoesFiltradas.length > 0 ? (
              <div className="space-y-4">
                {manutencoesFiltradas.map((manutencao) => (
                  <div
                    key={manutencao.id}
                    className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Wrench className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {NOMES_MANUTENCAO[manutencao.tipo]}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(manutencao.data).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            Quilometragem: {manutencao.km.toLocaleString()} km
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            R$ {manutencao.custo.toFixed(2)}
                          </div>
                        </div>

                        {manutencao.oficina && (
                          <p className="text-sm text-gray-600 mt-2">
                            Oficina: {manutencao.oficina}
                          </p>
                        )}

                        {manutencao.anotacao && (
                          <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded-lg">
                            {manutencao.anotacao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma manutenção encontrada
                </h3>
                <p className="text-gray-600">
                  {filtroTipo === 'todos'
                    ? 'Você ainda não registrou nenhuma manutenção.'
                    : `Nenhuma manutenção do tipo "${NOMES_MANUTENCAO[filtroTipo as keyof typeof NOMES_MANUTENCAO]}" foi encontrada.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}