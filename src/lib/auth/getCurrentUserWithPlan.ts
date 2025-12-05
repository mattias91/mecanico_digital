import { supabase } from '@/lib/supabase';
import { UserWithPlan } from '@/lib/types/plans';

/**
 * Helper server-side para obter o usuário autenticado com seu plano
 * 
 * Uso:
 * ```typescript
 * import { getCurrentUserWithPlan } from '@/lib/auth/getCurrentUserWithPlan';
 * 
 * const userWithPlan = await getCurrentUserWithPlan();
 * 
 * if (!userWithPlan) {
 *   // Usuário não autenticado
 *   return { error: 'Não autorizado' };
 * }
 * 
 * // Verificar features do plano
 * if (userWithPlan.plan?.features.ocr) {
 *   // Usuário tem acesso ao OCR
 * }
 * ```
 */
export async function getCurrentUserWithPlan(): Promise<UserWithPlan | null> {
  try {
    // 1. Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Erro ao obter usuário:', authError);
      return null;
    }

    // 2. Buscar dados do usuário na tabela usuarios_temp com join no plano
    const { data: userData, error: userError } = await supabase
      .from('usuarios_temp')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return null;
    }

    return userData as UserWithPlan;
  } catch (error) {
    console.error('Erro inesperado ao obter usuário com plano:', error);
    return null;
  }
}

/**
 * Verificar se o usuário tem acesso a uma feature específica
 * 
 * Uso:
 * ```typescript
 * const hasOCR = await userHasFeature('ocr');
 * const hasWhatsApp = await userHasFeature('whatsapp');
 * ```
 */
export async function userHasFeature(feature: 'ocr' | 'whatsapp'): Promise<boolean> {
  const userWithPlan = await getCurrentUserWithPlan();
  
  if (!userWithPlan || !userWithPlan.plan) {
    return false;
  }

  return userWithPlan.plan.features[feature] === true;
}

/**
 * Verificar se a assinatura do usuário está ativa
 */
export async function isSubscriptionActive(): Promise<boolean> {
  const userWithPlan = await getCurrentUserWithPlan();
  
  if (!userWithPlan) {
    return false;
  }

  // Verificar status da assinatura
  if (userWithPlan.subscription_status !== 'active') {
    return false;
  }

  // Verificar se a data de validade ainda não expirou (se houver)
  if (userWithPlan.plan_valid_until) {
    const validUntil = new Date(userWithPlan.plan_valid_until);
    const now = new Date();
    
    if (validUntil < now) {
      return false;
    }
  }

  return true;
}
