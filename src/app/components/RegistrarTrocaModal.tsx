'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { saveServiceRecord, getLastRecordsByKey, CardUpdateData } from '@/lib/serviceRecordsStorage';

interface RegistrarTrocaModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceKey: string;
  maintenanceName: string;
  currentOdometer: number;
  vehicleId: string;
  onSave?: () => void;
  onOptimisticUpdate?: (maintenanceKey: string, cardData: CardUpdateData) => void;
}

// Intervalos padrão de manutenção (em km)
const INTERVALOS_PADRAO: Record<string, number> = {
  oil: 10000,
  brake_pad: 30000,
  filter: 10000,
  tire: 40000,
  inspection: 10000,
  coolant: 40000,
  timing_belt: 60000,
  timing_chain: 100000,
};

export default function RegistrarTrocaModal({
  isOpen,
  onClose,
  maintenanceKey,
  maintenanceName,
  currentOdometer,
  vehicleId,
  onSave,
  onOptimisticUpdate,
}: RegistrarTrocaModalProps) {
  const [formData, setFormData] = useState({
    odometer: currentOdometer.toString(),
    cost: '',
    notes: '',
    interval: INTERVALOS_PADRAO[maintenanceKey]?.toString() || '10000',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetar formulário quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        odometer: currentOdometer.toString(),
        cost: '',
        notes: '',
        interval: INTERVALOS_PADRAO[maintenanceKey]?.toString() || '10000',
      });
      setError(null);
    }
  }, [isOpen, currentOdometer, maintenanceKey]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError(null);

    // Validação básica
    const odometer = parseInt(formData.odometer);
    const cost = parseFloat(formData.cost) || 0;
    const interval = parseInt(formData.interval) || INTERVALOS_PADRAO[maintenanceKey] || 10000;

    if (isNaN(odometer) || odometer <= 0) {
      setError('Quilometragem inválida');
      return;
    }

    if (cost < 0) {
      setError('Custo não pode ser negativo');
      return;
    }

    setIsSaving(true);

    try {
      // Calcular próxima manutenção
      const nextDueKm = odometer + interval;
      const remainingKm = nextDueKm - currentOdometer;

      // Determinar status
      let status: 'ok' | 'proximo' | 'atrasado' = 'ok';
      if (remainingKm < 0) {
        status = 'atrasado';
      } else if (remainingKm <= interval * 0.2) {
        status = 'proximo';
      }

      // Dados do registro (formato correto para saveServiceRecord)
      const recordData = {
        maintenance_item_key: maintenanceKey,
        service_date: new Date().toISOString(),
        odometer_at_service: odometer, // ✅ Campo correto
        interval_used_km: interval, // ✅ Adicionar intervalo
        cost,
        notes: formData.notes,
      };

      // Optimistic update ANTES de salvar
      if (onOptimisticUpdate) {
        const optimisticCardData: CardUpdateData = {
          last_service_km: odometer,
          next_due_km: nextDueKm,
          remaining_km: remainingKm,
          status,
          synced: false, // Marca como não sincronizado
        };
        onOptimisticUpdate(maintenanceKey, optimisticCardData);
      }

      // Salvar no storage (localStorage + Supabase se configurado)
      // ✅ Passar vehicleId como segundo parâmetro
      await saveServiceRecord(recordData, vehicleId);

      // Após salvar com sucesso, atualizar para synced: true
      if (onOptimisticUpdate) {
        const syncedCardData: CardUpdateData = {
          last_service_km: odometer,
          next_due_km: nextDueKm,
          remaining_km: remainingKm,
          status,
          synced: true, // Marca como sincronizado
        };
        onOptimisticUpdate(maintenanceKey, syncedCardData);
      }

      // Callback de sucesso
      if (onSave) {
        onSave();
      }

      // Fechar modal
      onClose();
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      setError('Erro ao salvar registro. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Registrar {maintenanceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo: Quilometragem */}
          <div>
            <Label htmlFor="odometer" className="text-sm font-medium text-slate-700">
              Quilometragem da Troca *
            </Label>
            <Input
              id="odometer"
              type="number"
              value={formData.odometer}
              onChange={(e) => handleInputChange('odometer', e.target.value)}
              placeholder="Ex: 45000"
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              KM atual do veículo: {currentOdometer.toLocaleString('pt-BR')} km
            </p>
          </div>

          {/* Campo: Intervalo */}
          <div>
            <Label htmlFor="interval" className="text-sm font-medium text-slate-700">
              Intervalo de Troca (km)
            </Label>
            <Input
              id="interval"
              type="number"
              value={formData.interval}
              onChange={(e) => handleInputChange('interval', e.target.value)}
              placeholder="Ex: 10000"
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Próxima troca será em: {(parseInt(formData.odometer) + parseInt(formData.interval || '0')).toLocaleString('pt-BR')} km
            </p>
          </div>

          {/* Campo: Custo */}
          <div>
            <Label htmlFor="cost" className="text-sm font-medium text-slate-700">
              Custo (R$)
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              placeholder="Ex: 150.00"
              className="mt-1"
            />
          </div>

          {/* Campo: Observações */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Observações
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Ex: Troca realizada na oficina X, peças originais..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Registro
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
