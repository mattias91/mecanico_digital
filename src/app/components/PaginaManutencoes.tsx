'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, DollarSign, MapPin, FileText, Upload, Image as ImageIcon, X, Eye } from 'lucide-react';
import { Veiculo, Manutencao, TipoManutencao } from '@/lib/types';

interface PaginaManutencoesProps {
  veiculo: Veiculo;
  manutencoes: Manutencao[];
  onRegistrarManutencao: (manutencao: {
    tipo: TipoManutencao;
    data: string;
    km: number;
    custo: number;
    oficina?: string;
    anotacao?: string;
    arquivo_url?: string;
  }) => void;
}

const NOMES_MANUTENCAO: Record<string, string> = {
  oleo: 'Óleo',
  pastilha: 'Pastilhas de Freio',
  filtro: 'Filtros',
  pneu: 'Pneus',
  revisao: 'Revisão Geral',
  arrefecimento: 'Sistema de Arrefecimento',
  correia_dentada: 'Correia Dentada',
  corrente_comando: 'Corrente de Comando',
};

// Função helper para formatar números de forma consistente
const formatarNumero = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Função helper para formatar moeda
const formatarMoeda = (valor: number): string => {
  return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function PaginaManutencoes({ veiculo, manutencoes, onRegistrarManutencao }: PaginaManutencoesProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipo, setTipo] = useState<TipoManutencao>('oleo');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [km, setKm] = useState(veiculo.km_atual.toString());
  const [custo, setCusto] = useState('');
  const [oficina, setOficina] = useState('');
  const [anotacao, setAnotacao] = useState('');
  const [arquivoPreview, setArquivoPreview] = useState<string | null>(null);
  const [arquivoNome, setArquivoNome] = useState<string>('');
  const [notaFiscalSelecionada, setNotaFiscalSelecionada] = useState<string | null>(null);

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoNome(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setArquivoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerArquivo = () => {
    setArquivoPreview(null);
    setArquivoNome('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onRegistrarManutencao({
      tipo,
      data,
      km: parseInt(km),
      custo: parseFloat(custo),
      oficina: oficina || undefined,
      anotacao: anotacao || undefined,
      arquivo_url: arquivoPreview || undefined,
    });

    // Resetar formulário
    setMostrarFormulario(false);
    setTipo('oleo');
    setData(new Date().toISOString().split('T')[0]);
    setKm(veiculo.km_atual.toString());
    setCusto('');
    setOficina('');
    setAnotacao('');
    setArquivoPreview(null);
    setArquivoNome('');
  };

  // Ordenar manutenções por data (mais recente primeiro)
  const manutencoesOrdenadas = [...manutencoes].sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  // Calcular total gasto
  const totalGasto = manutencoes.reduce((acc, m) => acc + m.custo, 0);

  // Filtrar manutenções com notas fiscais
  const manutencoesComNotaFiscal = manutencoesOrdenadas.filter(m => m.arquivo_url);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com Botão de Adicionar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#E8E8E8] to-[#A0A0A0] bg-clip-text text-transparent">Histórico de Manutenções</h2>
          <p className="text-xs sm:text-sm text-[#B0B0B0] mt-1">
            {manutencoes.length} manutenções • Total: R$ {formatarMoeda(totalGasto)}
          </p>
        </div>
        <Button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Manutenção
        </Button>
      </div>

      {/* Formulário de Nova Manutenção */}
      {mostrarFormulario && (
        <Card className="p-4 sm:p-6 bg-white border-slate-200">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
            Registrar Nova Manutenção
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo" className="text-xs sm:text-sm">Tipo de Manutenção</Label>
                <Select value={tipo} onValueChange={(value) => setTipo(value as TipoManutencao)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOMES_MANUTENCAO).map(([key, nome]) => (
                      <SelectItem key={key} value={key}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data" className="text-xs sm:text-sm">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="km" className="text-xs sm:text-sm">Quilometragem</Label>
                <Input
                  id="km"
                  type="number"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="custo" className="text-xs sm:text-sm">Custo (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                  className="mt-1"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="oficina" className="text-xs sm:text-sm">Oficina (opcional)</Label>
                <Input
                  id="oficina"
                  type="text"
                  value={oficina}
                  onChange={(e) => setOficina(e.target.value)}
                  className="mt-1"
                  placeholder="Nome da oficina"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="anotacao" className="text-xs sm:text-sm">Anotações (opcional)</Label>
                <Textarea
                  id="anotacao"
                  value={anotacao}
                  onChange={(e) => setAnotacao(e.target.value)}
                  className="mt-1"
                  placeholder="Detalhes da manutenção..."
                  rows={3}
                />
              </div>

              {/* Campo de Upload de Nota Fiscal - DESTAQUE */}
              <div className="sm:col-span-2">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="nota-fiscal" className="text-sm font-semibold text-slate-900">
                        📸 Anexar Nota Fiscal
                      </Label>
                      <p className="text-xs text-slate-600">Tire uma foto ou selecione um arquivo</p>
                    </div>
                  </div>
                  {!arquivoPreview ? (
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer bg-white">
                      <input
                        id="nota-fiscal"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleArquivoChange}
                        className="hidden"
                      />
                      <label htmlFor="nota-fiscal" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                            <Upload className="w-7 h-7 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Clique aqui para anexar
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              📷 Tire uma foto da nota fiscal ou selecione um arquivo
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Formatos: PNG, JPG ou PDF (até 10MB)
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-900">✅ {arquivoNome}</p>
                            <p className="text-xs text-green-700">Nota fiscal anexada com sucesso</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removerArquivo}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Salvar Manutenção
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarFormulario(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Seção de Notas Fiscais */}
      {manutencoesComNotaFiscal.length > 0 && (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Notas Fiscais
                </h3>
                <p className="text-xs text-slate-600">
                  {manutencoesComNotaFiscal.length} documento(s) anexado(s)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {manutencoesComNotaFiscal.map((manutencao) => (
              <div
                key={manutencao.id}
                className="bg-white rounded-lg p-3 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setNotaFiscalSelecionada(manutencao.arquivo_url || null)}
              >
                <div className="aspect-square bg-slate-100 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                  {manutencao.arquivo_url?.startsWith('data:image') ? (
                    <img
                      src={manutencao.arquivo_url}
                      alt="Nota Fiscal"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-900 truncate">
                  {NOMES_MANUTENCAO[manutencao.tipo]}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(manutencao.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal de Visualização de Nota Fiscal */}
      {notaFiscalSelecionada && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setNotaFiscalSelecionada(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Nota Fiscal</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotaFiscalSelecionada(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              {notaFiscalSelecionada.startsWith('data:image') ? (
                <img
                  src={notaFiscalSelecionada}
                  alt="Nota Fiscal"
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-slate-400 mb-4" />
                  <p className="text-slate-600">Documento PDF</p>
                  <Button
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.open(notaFiscalSelecionada, '_blank')}
                  >
                    Abrir PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Manutenções */}
      <div className="space-y-3">
        {manutencoesOrdenadas.length === 0 ? (
          <Card className="p-8 sm:p-12 bg-white border-slate-200 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                Nenhuma manutenção registrada
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Comece registrando suas manutenções para acompanhar o histórico do seu veículo.
              </p>
              <Button
                onClick={() => setMostrarFormulario(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeira Manutenção
              </Button>
            </div>
          </Card>
        ) : (
          manutencoesOrdenadas.map((manutencao) => (
            <Card key={manutencao.id} className="p-4 sm:p-5 bg-white border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                      {NOMES_MANUTENCAO[manutencao.tipo]}
                    </h4>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {manutencao.tipo}
                    </span>
                    {manutencao.arquivo_url && (
                      <button
                        onClick={() => setNotaFiscalSelecionada(manutencao.arquivo_url || null)}
                        className="ml-auto px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 hover:bg-green-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Nota Fiscal
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{new Date(manutencao.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>R$ {formatarMoeda(manutencao.custo)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{formatarNumero(manutencao.km)} km</span>
                    </div>
                    {manutencao.oficina && (
                      <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="truncate">{manutencao.oficina}</span>
                      </div>
                    )}
                  </div>

                  {manutencao.anotacao && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 italic">
                      {manutencao.anotacao}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
