// Tipos do banco de dados

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

export interface Veiculo {
  id: string;
  id_usuario: string;
  tipo: 'carro' | 'moto';
  marca: string;
  modelo: string;
  ano: number;
  km_atual: number;
  foto_url?: string;
  tipo_oleo: string;
}

export type TipoManutencao = 
  | 'oleo' 
  | 'pastilha' 
  | 'filtro' 
  | 'pneu' 
  | 'revisao' 
  | 'arrefecimento'
  | 'correia_dentada'
  | 'corrente_comando'
  | 'outra';

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

export interface Alerta {
  id: string;
  id_veiculo: string;
  tipo_manutencao: TipoManutencao;
  km_limite: number;
  km_ultimo: number;
  status: 'ok' | 'proximo' | 'atrasado';
  remaining_km?: number; // Quilometragem restante até próxima manutenção
  sem_registro?: boolean; // Flag para indicar ausência de registro
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
  pastilha: 20000,
  filtro: 10000,
  pneu: 40000,
  revisao: 10000,
  arrefecimento: 20000,
  correia_dentada: 60000,
  corrente_comando: 100000,
};

export const NOMES_MANUTENCAO: Record<TipoManutencao, string> = {
  oleo: 'Troca de Óleo',
  pastilha: 'Pastilha de Freio',
  filtro: 'Filtros',
  pneu: 'Pneus',
  revisao: 'Revisão Geral',
  arrefecimento: 'Líquido de Arrefecimento',
  correia_dentada: 'Correia Dentada',
  corrente_comando: 'Corrente de Comando',
  outra: 'Outra',
};
