'use client';

import { useState } from 'react';
import { Gauge, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface AtualizarKmProps {
  kmAtual: number;
  vehicleId: string;
  onAtualizar: (novoKm: number) => void;
  onVoltar: () => void;
}

export default function AtualizarKm({ kmAtual, vehicleId, onAtualizar, onVoltar }: AtualizarKmProps) {
  const [novoKm, setNovoKm] = useState(kmAtual.toString());
  const [mostrarModal, setMostrarModal] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseInt(novoKm);
    
    if (isNaN(km) || km < 0) {
      setErro('Quilometragem inválida');
      return;
    }

    // Se for redução, abrir modal
    if (km < kmAtual) {
      setMostrarModal(true);
      setErro('');
      return;
    }

    // Se não for redução, atualizar normalmente
    onAtualizar(km);
  };

  const handleConfirmarReducao = async () => {
    if (!motivo.trim()) {
      setErro('Motivo é obrigatório para redução de quilometragem');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      // Obter token do usuário
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErro('Sessão expirada — faça login novamente');
        setCarregando(false);
        return;
      }

      // Chamar endpoint backend
      const response = await fetch('/api/vehicles/update-odometer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          newOdometer: parseInt(novoKm),
          reason: motivo.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar quilometragem');
      }

      // Sucesso — atualizar UI
      onAtualizar(parseInt(novoKm));
      setMostrarModal(false);
      setMotivo('');
      
    } catch (error: any) {
      console.error('Erro ao confirmar redução:', error);
      setErro(error.message || 'Erro ao atualizar quilometragem');
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelar = () => {
    setMostrarModal(false);
    setMotivo('');
    setErro('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0F0F0F] p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={onVoltar}
              className="p-2 hover:bg-[#2A2A2A] rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-white ml-4">Atualizar Quilometragem</h1>
          </div>

          <div className="text-center mb-8">
            <Gauge className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">
              Quilometragem atual: <span className="font-semibold text-white">{kmAtual.toLocaleString()} km</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="novoKm" className="block text-sm font-medium text-gray-300 mb-2">
                Nova Quilometragem
              </label>
              <input
                type="number"
                id="novoKm"
                value={novoKm}
                onChange={(e) => setNovoKm(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Digite a quilometragem"
                required
              />
              {parseInt(novoKm) < kmAtual && (
                <p className="text-sm text-yellow-500 mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Você está reduzindo o odômetro — será necessário informar o motivo
                </p>
              )}
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/50"
            >
              Atualizar Quilometragem
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Confirmação de Redução */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Redução de Odômetro</h3>
                <p className="text-sm text-gray-400">Confirmação necessária</p>
              </div>
            </div>

            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-300 mb-2">
                Você está reduzindo o odômetro de <span className="font-bold text-white">{kmAtual.toLocaleString()} km</span> para <span className="font-bold text-white">{parseInt(novoKm).toLocaleString()} km</span>.
              </p>
              <p className="text-xs text-yellow-500">
                Esta ação será registrada no histórico de auditoria.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="motivo" className="block text-sm font-medium text-gray-300 mb-2">
                Motivo da redução <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Troca de hodômetro, erro de digitação anterior, manutenção do painel..."
                className="w-full bg-[#0F0F0F] border-[#2A2A2A] text-white min-h-[100px]"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Informe o motivo para justificar a redução
              </p>
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm mb-4">
                {erro}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleCancelar}
                variant="outline"
                className="flex-1 border-[#2A2A2A] text-gray-300 hover:bg-[#2A2A2A]"
                disabled={carregando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarReducao}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                disabled={carregando || !motivo.trim()}
              >
                {carregando ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
