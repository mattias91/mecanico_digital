'use client';

import { useState } from 'react';
import { ArrowLeft, Calendar, DollarSign, MapPin, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle, Maintenance, MaintenanceType, MAINTENANCE_LABELS } from '@/lib/types';

interface MaintenanceFormProps {
  vehicle: Vehicle;
  onSubmit: (maintenance: Maintenance) => void;
  onCancel: () => void;
}

export default function MaintenanceForm({ vehicle, onSubmit, onCancel }: MaintenanceFormProps) {
  const [tipo, setTipo] = useState<MaintenanceType>('oleo');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [km, setKm] = useState(vehicle.km_atual.toString());
  const [custo, setCusto] = useState('');
  const [oficina, setOficina] = useState('');
  const [anotacao, setAnotacao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const maintenance: Maintenance = {
      id: Date.now().toString(),
      id_veiculo: vehicle.id,
      tipo,
      data,
      km: parseInt(km),
      custo: custo ? parseFloat(custo) : undefined,
      oficina: oficina || undefined,
      anotacao: anotacao || undefined,
    };

    onSubmit(maintenance);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-6">
      <Button
        onClick={onCancel}
        variant="ghost"
        className="mb-6 text-[#0057FF] hover:text-[#0041CC]"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </Button>

      <Card className="p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-[#333333] mb-6">Registrar Manutenção</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Manutenção */}
          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-[#333333] font-semibold">
              Tipo de Manutenção
            </Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as MaintenanceType)}>
              <SelectTrigger className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MAINTENANCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Quilometragem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data" className="text-[#333333]">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km" className="text-[#333333]">
                Quilometragem
              </Label>
              <Input
                id="km"
                type="number"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                min="0"
                required
              />
            </div>
          </div>

          {/* Custo e Oficina */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custo" className="text-[#333333]">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Custo (Opcional)
              </Label>
              <Input
                id="custo"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oficina" className="text-[#333333]">
                <MapPin className="w-4 h-4 inline mr-2" />
                Oficina (Opcional)
              </Label>
              <Input
                id="oficina"
                placeholder="Nome da oficina"
                value={oficina}
                onChange={(e) => setOficina(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
              />
            </div>
          </div>

          {/* Anotações */}
          <div className="space-y-2">
            <Label htmlFor="anotacao" className="text-[#333333]">
              <FileText className="w-4 h-4 inline mr-2" />
              Anotações (Opcional)
            </Label>
            <Textarea
              id="anotacao"
              placeholder="Observações sobre a manutenção..."
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              className="min-h-24 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
            />
          </div>

          {/* Upload de Nota Fiscal */}
          <div className="space-y-2">
            <Label className="text-[#333333]">
              <Upload className="w-4 h-4 inline mr-2" />
              Nota Fiscal (Opcional)
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#0057FF] transition-colors cursor-pointer">
              <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Clique para adicionar foto ou PDF</p>
            </div>
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
              className="flex-1 h-12 bg-[#0057FF] hover:bg-[#0041CC] text-white font-semibold rounded-lg"
            >
              Salvar Manutenção
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
