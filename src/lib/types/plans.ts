// Tipos para o sistema de planos

export interface Plan {
  id: string;
  name: string;
  code: 'BASIC' | 'PLUS' | 'PRO';
  description: string | null;
  features: {
    ocr: boolean;
    whatsapp: boolean;
  };
  price_monthly: number;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone?: string | null;
  plan_id?: string | null;
  subscription_status?: string;
  provider?: string | null;
  provider_customer_id?: string | null;
  plan_valid_until?: string | null;
  created_at: string;
}

export interface UserWithPlan extends Usuario {
  plan: Plan | null;
}
