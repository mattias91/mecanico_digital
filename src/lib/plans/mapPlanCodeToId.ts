import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para consultas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Mapeia código do plano (BASIC, PLUS, PRO) para o ID correspondente no banco
 * @param planCode - Código do plano ('BASIC' | 'PLUS' | 'PRO')
 * @returns ID do plano ou null se não encontrado
 */
export async function mapPlanCodeToId(
  planCode: 'BASIC' | 'PLUS' | 'PRO'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id')
      .eq('code', planCode)
      .single();

    if (error) {
      console.error('Erro ao buscar plano:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Erro inesperado ao mapear plano:', error);
    return null;
  }
}

/**
 * Mapeia múltiplos códigos de plano de uma vez (otimizado)
 * @param planCodes - Array de códigos de plano
 * @returns Mapa { code: id }
 */
export async function mapMultiplePlanCodesToIds(
  planCodes: Array<'BASIC' | 'PLUS' | 'PRO'>
): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id, code')
      .in('code', planCodes);

    if (error) {
      console.error('Erro ao buscar planos:', error);
      return {};
    }

    // Criar mapa { code: id }
    const map: Record<string, string> = {};
    data?.forEach((plan) => {
      map[plan.code] = plan.id;
    });

    return map;
  } catch (error) {
    console.error('Erro inesperado ao mapear planos:', error);
    return {};
  }
}
