'use client';

import { ArrowLeft, Calendar, DollarSign, MapPin, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Maintenance, MAINTENANCE_LABELS } from '@/lib/types';
import { formatDate, formatCurrency, formatKm } from '@/lib/utils-vehicle';

interface MaintenanceHistoryProps {
  maintenances: Maintenance[];
  onBack: () => void;
}

export default function MaintenanceHistory({ maintenances, onBack }: MaintenanceHistoryProps) {
  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-6">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </Button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Manutenções</h2>
        <p className="text-gray-600">
          {maintenances.length} {maintenances.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </p>
      </div>

      {maintenances.length === 0 ? (
        <Card className="p-16 rounded-3xl text-center bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-lg">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-3">
            Nenhuma manutenção registrada
          </h3>
          <p className="text-gray-500 text-lg">
            Adicione sua primeira manutenção para começar o histórico
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {maintenances.map((maintenance) => (
            <Card
              key={maintenance.id}
              className="relative overflow-hidden p-6 rounded-2xl hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-md"
            >
              {/* Barra lateral colorida */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600 to-blue-400"></div>
              
              <div className="pl-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {MAINTENANCE_LABELS[maintenance.tipo]}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{formatDate(maintenance.data)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg">
                        <span className="font-bold text-blue-600">{formatKm(maintenance.km)}</span>
                      </div>
                    </div>
                  </div>
                  {maintenance.custo && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Custo</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(maintenance.custo)}
                      </p>
                    </div>
                  )}
                </div>

                {maintenance.oficina && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 bg-gray-50 px-3 py-2 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{maintenance.oficina}</span>
                  </div>
                )}

                {maintenance.anotacao && (
                  <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      <p className="leading-relaxed">{maintenance.anotacao}</p>
                    </div>
                  </div>
                )}

                {maintenance.arquivo_url && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl font-semibold"
                    >
                      Ver Nota Fiscal
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
