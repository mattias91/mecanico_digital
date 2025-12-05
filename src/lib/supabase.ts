import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com fallback seguro
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Função para verificar se as credenciais estão configuradas
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl !== '' && 
    supabaseAnonKey !== '' &&
    supabaseUrl !== 'https://placeholder.supabase.co';
};

// Criar cliente Supabase apenas se configurado
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Tipos do banco de dados
export type Database = {
  public: {
    Tables: {
      usuarios_temp: {
        Row: {
          id: string;
          email: string;
          nome: string;
          telefone?: string;
          plan_id?: string;
          subscription_status?: string;
          provider?: string;
          provider_customer_id?: string;
          plan_valid_until?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          nome: string;
          telefone?: string;
          plan_id?: string;
          subscription_status?: string;
          provider?: string;
          provider_customer_id?: string;
          plan_valid_until?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nome?: string;
          telefone?: string;
          plan_id?: string;
          subscription_status?: string;
          provider?: string;
          provider_customer_id?: string;
          plan_valid_until?: string;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          code: 'BASIC' | 'PLUS' | 'PRO';
          description?: string;
          features: {
            ocr: boolean;
            whatsapp: boolean;
          };
          price_monthly: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: 'BASIC' | 'PLUS' | 'PRO';
          description?: string;
          features: {
            ocr: boolean;
            whatsapp: boolean;
          };
          price_monthly: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: 'BASIC' | 'PLUS' | 'PRO';
          description?: string;
          features?: {
            ocr: boolean;
            whatsapp: boolean;
          };
          price_monthly?: number;
          created_at?: string;
        };
      };
      veiculos: {
        Row: {
          id: string;
          id_usuario: string;
          tipo: 'carro' | 'moto';
          marca: string;
          modelo: string;
          ano: number;
          km_atual: number;
          tipo_oleo: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          id_usuario: string;
          tipo: 'carro' | 'moto';
          marca: string;
          modelo: string;
          ano: number;
          km_atual: number;
          tipo_oleo: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          id_usuario?: string;
          tipo?: 'carro' | 'moto';
          marca?: string;
          modelo?: string;
          ano?: number;
          km_atual?: number;
          tipo_oleo?: string;
          created_at?: string;
        };
      };
      manutencoes: {
        Row: {
          id: string;
          id_veiculo: string;
          tipo: string;
          data: string;
          km: number;
          custo: number;
          oficina?: string;
          anotacao?: string;
          arquivo_url?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          id_veiculo: string;
          tipo: string;
          data: string;
          km: number;
          custo: number;
          oficina?: string;
          anotacao?: string;
          arquivo_url?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          id_veiculo?: string;
          tipo?: string;
          data?: string;
          km?: number;
          custo?: number;
          oficina?: string;
          anotacao?: string;
          arquivo_url?: string;
          created_at?: string;
        };
      };
      intervalos_manutencao: {
        Row: {
          id: string;
          id_usuario: string;
          oleo: number;
          pastilha: number;
          filtro: number;
          pneu: number;
          revisao: number;
          arrefecimento: number;
          correia_dentada: number;
          corrente_comando: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          id_usuario: string;
          oleo?: number;
          pastilha?: number;
          filtro?: number;
          pneu?: number;
          revisao?: number;
          arrefecimento?: number;
          correia_dentada?: number;
          corrente_comando?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          id_usuario?: string;
          oleo?: number;
          pastilha?: number;
          filtro?: number;
          pneu?: number;
          revisao?: number;
          arrefecimento?: number;
          correia_dentada?: number;
          corrente_comando?: number;
          created_at?: string;
        };
      };
      service_records: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          maintenance_item_key: string;
          odometer_at_service: number;
          service_date: string;
          interval_used_km?: number;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          maintenance_item_key: string;
          odometer_at_service: number;
          service_date: string;
          interval_used_km?: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_id?: string;
          maintenance_item_key?: string;
          odometer_at_service?: number;
          service_date?: string;
          interval_used_km?: number;
          notes?: string;
          created_at?: string;
        };
      };
    };
  };
};
