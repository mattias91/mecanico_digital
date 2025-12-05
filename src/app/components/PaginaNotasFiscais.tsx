'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, X, Calendar, DollarSign, MapPin, Download, Search } from 'lucide-react';
import { Manutencao } from '@/lib/types';
import { Input } from '@/components/ui/input';

interface PaginaNotasFiscaisProps {
  manutencoes: Manutencao[];
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

// Função helper para formatar moeda
const formatarMoeda = (valor: number): string => {
  return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function PaginaNotasFiscais({ manutencoes }: PaginaNotasFiscaisProps) {
  const [notaFiscalSelecionada, setNotaFiscalSelecionada] = useState<{
    url: string;
    manutencao: Manutencao;
  } | null>(null);
  const [filtro, setFiltro] = useState('');

  // Filtrar manutenções com notas fiscais
  const manutencoesComNotaFiscal = manutencoes.filter(m => m.arquivo_url);

  // Aplicar filtro de busca
  const notasFiscaisFiltradas = manutencoesComNotaFiscal.filter(m => {
    const termoBusca = filtro.toLowerCase();
    return (
      NOMES_MANUTENCAO[m.tipo].toLowerCase().includes(termoBusca) ||
      m.oficina?.toLowerCase().includes(termoBusca) ||
      new Date(m.data).toLocaleDateString('pt-BR').includes(termoBusca)
    );
  });

  // Calcular total gasto em manutenções com nota fiscal
  const totalComNotaFiscal = manutencoesComNotaFiscal.reduce((acc, m) => acc + m.custo, 0);

  const handleDownload = (url: string, nomeArquivo: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Premium Dark */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#E8E8E8] to-[#A0A0A0] bg-clip-text text-transparent">
            Galeria de Notas Fiscais
          </h2>
          <p className="text-xs sm:text-sm text-[#808080] mt-1">
            {manutencoesComNotaFiscal.length} documento(s) • Total: R$ {formatarMoeda(totalComNotaFiscal)}
          </p>
        </div>

        {/* Barra de Busca Premium */}
        {manutencoesComNotaFiscal.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#606060]" />
            <Input
              type="text"
              placeholder="Buscar por tipo, oficina ou data..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-[#E8E8E8] placeholder:text-[#606060] focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
            />
          </div>
        )}
      </div>

      {/* Estado Vazio Premium */}
      {manutencoesComNotaFiscal.length === 0 ? (
        <Card className="p-8 sm:p-12 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#2A2A2A] text-center shadow-2xl">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#E8E8E8] mb-2">
              Nenhuma nota fiscal anexada
            </h3>
            <p className="text-xs sm:text-sm text-[#808080] mb-4">
              Ao registrar uma manutenção, você pode anexar a nota fiscal. Todas as notas aparecerão aqui para fácil acesso.
            </p>
            <div className="bg-[#0F1419] border border-[#3B82F6]/30 rounded-lg p-4 text-left">
              <p className="text-xs sm:text-sm text-[#E8E8E8] font-medium mb-2">
                💡 Como anexar notas fiscais:
              </p>
              <ol className="text-xs sm:text-sm text-[#A0A0A0] space-y-1 list-decimal list-inside">
                <li>Vá para a aba "Manutenções"</li>
                <li>Clique em "Nova Manutenção"</li>
                <li>Preencha os dados e anexe a foto da nota fiscal</li>
                <li>A nota aparecerá automaticamente aqui</li>
              </ol>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Galeria de Notas Fiscais Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notasFiscaisFiltradas.map((manutencao) => (
              <Card
                key={manutencao.id}
                className="overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#2A2A2A] hover:border-[#3B82F6]/50 hover:scale-[1.02]"
                onClick={() => setNotaFiscalSelecionada({
                  url: manutencao.arquivo_url || '',
                  manutencao
                })}
              >
                {/* Preview da Nota Fiscal */}
                <div className="aspect-[3/4] bg-[#0F0F0F] relative overflow-hidden">
                  {manutencao.arquivo_url?.startsWith('data:image') ? (
                    <img
                      src={manutencao.arquivo_url}
                      alt="Nota Fiscal"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-16 h-16 text-[#404040]" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-xs rounded-full font-medium shadow-lg shadow-blue-500/50">
                      Nota Fiscal
                    </span>
                  </div>
                </div>

                {/* Informações da Manutenção */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-[#E8E8E8] text-sm sm:text-base">
                    {NOMES_MANUTENCAO[manutencao.tipo]}
                  </h3>
                  
                  <div className="space-y-1.5 text-xs sm:text-sm text-[#808080]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(manutencao.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="font-medium text-[#4ADE80]">R$ {formatarMoeda(manutencao.custo)}</span>
                    </div>
                    {manutencao.oficina && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{manutencao.oficina}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-[#0F0F0F] border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1F1F1F] hover:text-[#E8E8E8] hover:border-[#3B82F6]/50 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotaFiscalSelecionada({
                        url: manutencao.arquivo_url || '',
                        manutencao
                      });
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Nota Fiscal
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Mensagem quando filtro não retorna resultados */}
          {notasFiscaisFiltradas.length === 0 && filtro && (
            <Card className="p-8 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#2A2A2A] text-center">
              <p className="text-[#808080]">
                Nenhuma nota fiscal encontrada para "{filtro}"
              </p>
            </Card>
          )}
        </>
      )}

      {/* Modal de Visualização em Tela Cheia Premium */}
      {notaFiscalSelecionada && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setNotaFiscalSelecionada(null)}
        >
          <div
            className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#2A2A2A] rounded-lg max-w-5xl w-full max-h-[95vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal Premium */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1A1A1A] to-[#141414] border-b border-[#2A2A2A] p-4 flex items-center justify-between z-10 backdrop-blur-sm bg-opacity-95">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-[#E8E8E8]">
                  {NOMES_MANUTENCAO[notaFiscalSelecionada.manutencao.tipo]}
                </h3>
                <p className="text-xs sm:text-sm text-[#808080]">
                  {new Date(notaFiscalSelecionada.manutencao.data).toLocaleDateString('pt-BR')} • 
                  <span className="text-[#4ADE80] font-medium"> R$ {formatarMoeda(notaFiscalSelecionada.manutencao.custo)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#0F0F0F] border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1F1F1F] hover:text-[#E8E8E8] hover:border-[#3B82F6]/50"
                  onClick={() => handleDownload(
                    notaFiscalSelecionada.url,
                    `nota-fiscal-${notaFiscalSelecionada.manutencao.tipo}-${notaFiscalSelecionada.manutencao.data}.jpg`
                  )}
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Baixar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#A0A0A0] hover:text-[#E8E8E8] hover:bg-[#1F1F1F]"
                  onClick={() => setNotaFiscalSelecionada(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4">
              {notaFiscalSelecionada.url.startsWith('data:image') ? (
                <img
                  src={notaFiscalSelecionada.url}
                  alt="Nota Fiscal"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-[#404040] mb-4" />
                  <p className="text-[#808080] mb-4">Documento PDF</p>
                  <Button
                    className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white shadow-lg shadow-blue-500/50"
                    onClick={() => window.open(notaFiscalSelecionada.url, '_blank')}
                  >
                    Abrir PDF em Nova Aba
                  </Button>
                </div>
              )}

              {/* Detalhes da Manutenção */}
              {notaFiscalSelecionada.manutencao.anotacao && (
                <Card className="mt-4 p-4 bg-[#0F1419] border-[#2A2A2A]">
                  <h4 className="text-sm font-semibold text-[#E8E8E8] mb-2">Anotações:</h4>
                  <p className="text-sm text-[#A0A0A0]">
                    {notaFiscalSelecionada.manutencao.anotacao}
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
