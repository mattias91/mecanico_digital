export type TipoManutencao =
  | 'oleo'
  | 'pastilha'
  | 'filtro'
  | 'pneu'
  | 'revisao'
  | 'arrefecimento'
  | 'correia_dentada'
  | 'corrente_comando';

export const NOMES_MANUTENCAO: Record<TipoManutencao, string> = {
  oleo: 'Troca de Óleo',
  pastilha: 'Pastilhas de Freio',
  filtro: 'Filtros',
  pneu: 'Pneus',
  revisao: 'Revisão Geral',
  arrefecimento: 'Sistema de Arrefecimento',
  correia_dentada: 'Correia de Acessórios',
  corrente_comando: 'Corrente de Comando',
};

export type TipoVeiculo = 'carro' | 'moto';

export interface Veiculo {
  id: string;
  id_usuario: string;
  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  ano: number;
  km_atual: number;
  tipo_oleo?: string;
}

export interface Manutencao {
  id: string;
  id_veiculo: string;
  tipo: TipoManutencao;
  data: string;
  km: number;
  custo: number;
  oficina?: string;
  anotacao?: string;
  arquivo_url?: string;
}

export type StatusAlerta = 'ok' | 'proximo' | 'atrasado';

export interface Alerta {
  id: string;
  id_veiculo: string;
  tipo_manutencao: TipoManutencao;
  km_ultimo: number;
  km_limite: number;
  status: StatusAlerta;
}

export interface IntervaloManutencao {
  oleo: number;
  pastilha: number;
  filtro: number;
  pneu: number;
  revisao: number;
  arrefecimento: number;
  correia_dentada: number;
  corrente_comando: number;
}

export const INTERVALOS_PADRAO: IntervaloManutencao = {
  oleo: 10000,
  pastilha: 40000,
  filtro: 20000,
  pneu: 50000,
  revisao: 10000,
  arrefecimento: 60000,
  correia_dentada: 100000,
  corrente_comando: 150000,
};