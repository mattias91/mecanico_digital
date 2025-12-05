'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface KmUpdateProps {
  currentKm: number;
  onSubmit: (newKm: number) => void;
  onCancel: () => void;
}

export default function KmUpdate({ currentKm, onSubmit, onCancel }: KmUpdateProps) {
  const [newKm, setNewKm] = useState(currentKm.toString());
  const [kmRodados, setKmRodados] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseInt(newKm));
  };

  const difference = parseInt(newKm) - currentKm;

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-6">
      <Button
        onClick={onCancel}
        variant="ghost"
        className="mb-6 text-[#0057FF] hover:text-[#0041CC]"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </Button>

      <Card className="p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-[#0057FF]" />
          </div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Atualizar Quilometragem</h2>
          <p className="text-gray-600">Mantenha o controle atualizado do seu veículo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quilometragem Atual */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Quilometragem Atual</p>
            <p className="text-3xl font-bold text-[#333333]">
              {currentKm.toLocaleString('pt-BR')} km
            </p>
          </div>

          {/* Nova Quilometragem */}
          <div className="space-y-2">
            <Label htmlFor="newKm" className="text-[#333333] font-semibold">
              Nova Quilometragem
            </Label>
            <Input
              id="newKm"
              type="number"
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
              className="h-14 text-xl border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
              min={currentKm}
              required
            />
            {difference > 0 && (
              <p className="text-sm text-[#3CCF4E] font-semibold">
                +{difference.toLocaleString('pt-BR')} km desde a última atualização
              </p>
            )}
            {difference < 0 && (
              <p className="text-sm text-[#FF3B30]">
                A nova quilometragem não pode ser menor que a atual
              </p>
            )}
          </div>

          {/* Km Rodados no Mês (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="kmRodados" className="text-[#333333]">
              Km Rodados no Mês (Opcional)
            </Label>
            <Input
              id="kmRodados"
              type="number"
              placeholder="Ex: 1500"
              value={kmRodados}
              onChange={(e) => setKmRodados(e.target.value)}
              className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
              min="0"
            />
            <p className="text-xs text-gray-500">
              Útil para acompanhar sua média mensal de uso
            </p>
          </div>

          {/* Informação sobre Recálculo */}
          <div className="p-4 bg-blue-50 rounded-xl border-2 border-[#0057FF]">
            <p className="text-sm text-[#0057FF] font-semibold">
              ℹ️ Ao atualizar, todos os alertas de manutenção serão recalculados automaticamente
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={difference < 0}
              className="flex-1 h-12 bg-[#0057FF] hover:bg-[#0041CC] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Atualizar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
