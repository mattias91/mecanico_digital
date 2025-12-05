'use client';

import { useState } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Vehicle, Alert, MAINTENANCE_LABELS } from '@/lib/types';

interface ConfigScreenProps {
  vehicle: Vehicle;
  alerts: Alert[];
  onSave: (vehicle: Vehicle, intervals: Record<string, number>) => void;
  onCancel: () => void;
}

export default function ConfigScreen({ vehicle, alerts, onSave, onCancel }: ConfigScreenProps) {
  const [marca, setMarca] = useState(vehicle.marca);
  const [modelo, setModelo] = useState(vehicle.modelo);
  const [ano, setAno] = useState(vehicle.ano.toString());
  const [tipoOleo, setTipoOleo] = useState(vehicle.tipo_oleo || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Intervalos de manutenção
  const [intervals, setIntervals] = useState<Record<string, number>>(
    alerts.reduce((acc, alert) => {
      acc[alert.tipo_manutencao] = alert.intervalo;
      return acc;
    }, {} as Record<string, number>)
  );

  const handleIntervalChange = (tipo: string, value: string) => {
    setIntervals({
      ...intervals,
      [tipo]: parseInt(value) || 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedVehicle: Vehicle = {
      ...vehicle,
      marca,
      modelo,
      ano: parseInt(ano),
      tipo_oleo: tipoOleo,
    };

    onSave(updatedVehicle, intervals);
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-[#0057FF]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#333333]">Configurações</h2>
            <p className="text-gray-600">Personalize seu veículo e alertas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados do Veículo */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#333333] border-b pb-2">
              Dados do Veículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca" className="text-[#333333]">Marca</Label>
                <Input
                  id="marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo" className="text-[#333333]">Modelo</Label>
                <Input
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano" className="text-[#333333]">Ano</Label>
                <Input
                  id="ano"
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoOleo" className="text-[#333333]">Tipo de Óleo</Label>
                <Input
                  id="tipoOleo"
                  value={tipoOleo}
                  onChange={(e) => setTipoOleo(e.target.value)}
                  className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                  placeholder="Ex: 5W30"
                />
              </div>
            </div>
          </div>

          {/* Intervalos de Manutenção */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#333333] border-b pb-2">
              Intervalos de Manutenção (em km)
            </h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <Label className="text-[#333333] font-medium">
                    {MAINTENANCE_LABELS[alert.tipo_manutencao]}
                  </Label>
                  <Input
                    type="number"
                    value={intervals[alert.tipo_manutencao]}
                    onChange={(e) => handleIntervalChange(alert.tipo_manutencao, e.target.value)}
                    className="w-32 h-10 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                    min="1000"
                    step="1000"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              * Os intervalos são sugestões. Consulte o manual do seu veículo para valores específicos.
            </p>
          </div>

          {/* Notificações */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#333333] border-b pb-2">
              Notificações
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-[#0057FF]" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <Label className="text-[#333333] font-medium">
                    Alertas de Manutenção
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receba notificações quando uma manutenção estiver próxima
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
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
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
