'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Bell, Settings2, Download, FileText } from 'lucide-react';
import { Veiculo, IntervaloManutencao } from '@/lib/types';
import { toast } from 'sonner';
import { exportUnsyncedRecords, generateBackendDocs, getUnsyncedRecords } from '@/lib/serviceRecordsStorage';

interface PaginaConfiguracoesProps {
  veiculo: Veiculo;
  intervalos: IntervaloManutencao;
  notificacoesAtivas: boolean;
  onSalvar: (
    veiculo: Omit<Veiculo, 'id' | 'id_usuario'>,
    intervalos: IntervaloManutencao,
    notificacoes: boolean
  ) => void;
}

const NOMES_INTERVALOS: Record<keyof IntervaloManutencao, string> = {
  oleo: 'Troca de Óleo',
  pastilha: 'Pastilhas de Freio',
  filtro: 'Filtros',
  pneu: 'Rodízio de Pneus',
  revisao: 'Revisão Geral',
  arrefecimento: 'Sistema de Arrefecimento',
  correia_dentada: 'Correia Dentada',
  corrente_comando: 'Corrente de Comando',
};

// Função helper para formatar números de forma consistente
const formatarNumero = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function PaginaConfiguracoes({
  veiculo,
  intervalos,
  notificacoesAtivas,
  onSalvar,
}: PaginaConfiguracoesProps) {
  // Estados para intervalos
  const [intervalosEditados, setIntervalosEditados] = useState(intervalos);

  // Estado para notificações
  const [notificacoes, setNotificacoes] = useState(notificacoesAtivas);

  const handleSalvar = () => {
    onSalvar(
      {
        tipo: veiculo.tipo,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        km_atual: veiculo.km_atual,
        tipo_oleo: veiculo.tipo_oleo,
      },
      intervalosEditados,
      notificacoes
    );
    
    // Mostrar notificação de sucesso
    toast.success('Configurações salvas com sucesso!', {
      description: 'Todas as alterações foram aplicadas.',
      duration: 3000,
    });
  };

  const handleIntervaloChange = (key: keyof IntervaloManutencao, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setIntervalosEditados({
        ...intervalosEditados,
        [key]: numValue,
      });
    }
  };

  const handleExportarRegistros = () => {
    const unsynced = getUnsyncedRecords();
    
    if (unsynced.length === 0) {
      toast.info('Nenhum registro pendente', {
        description: 'Não há registros não sincronizados para exportar.',
      });
      return;
    }

    exportUnsyncedRecords();
    toast.success('Registros exportados!', {
      description: `${unsynced.length} registro(s) exportado(s) com sucesso.`,
      duration: 3000,
    });
  };

  const handleGerarDocumentacao = () => {
    generateBackendDocs();
    toast.success('Documentação gerada!', {
      description: 'Guia de integração de backend baixado com sucesso.',
      duration: 3000,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intervalos de Manutenção */}
      <Card className="p-4 sm:p-6 bg-white border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Intervalos de Manutenção (KM)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(NOMES_INTERVALOS).map(([key, nome]) => (
            <div key={key}>
              <Label htmlFor={key} className="text-xs sm:text-sm">{nome}</Label>
              <Input
                id={key}
                type="number"
                value={intervalosEditados[key as keyof IntervaloManutencao]}
                onChange={(e) => handleIntervaloChange(key as keyof IntervaloManutencao, e.target.value)}
                className="mt-1"
                placeholder="Ex: 10000"
              />
              <p className="text-xs text-slate-500 mt-1">
                A cada {formatarNumero(intervalosEditados[key as keyof IntervaloManutencao])} km
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSalvar}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </Card>

      {/* Notificações */}
      <Card className="p-4 sm:p-6 bg-white border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Notificações
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Alertas de Manutenção</p>
            <p className="text-xs text-slate-600 mt-1">
              Receba notificações quando uma manutenção estiver próxima
            </p>
          </div>
          <Switch
            checked={notificacoes}
            onCheckedChange={setNotificacoes}
          />
        </div>
      </Card>

      {/* Gerenciamento de Registros Locais */}
      <Card className="p-4 sm:p-6 bg-white border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Gerenciamento de Registros
          </h3>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Os registros de manutenção são salvos localmente no seu navegador. 
          Use as opções abaixo para exportar ou gerar documentação para integração com backend.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExportarRegistros}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Registros Não Sincronizados
          </Button>

          <Button
            onClick={handleGerarDocumentacao}
            variant="outline"
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Requisição de Backend
          </Button>
        </div>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Os registros são salvos apenas no seu navegador. 
            Para persistência permanente, um desenvolvedor precisa implementar o backend 
            usando a documentação gerada.
          </p>
        </div>
      </Card>

      {/* Informações Adicionais */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Dica:</strong> Ajuste os intervalos de acordo com as recomendações do fabricante do seu veículo. 
          Intervalos menores garantem maior segurança e durabilidade.
        </p>
      </Card>
    </div>
  );
}
