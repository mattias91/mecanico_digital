import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PARTE 3B - Webhook completo com integração Supabase
 * 
 * Esta versão implementa a lógica completa de atualização do plano do usuário:
 * - Localiza usuário pelo email
 * - Localiza plano pelo planCode
 * - Atualiza usuarios_temp com plano_id e dados de assinatura
 */

interface WebhookPayload {
  email: string;
  planCode: 'BASICO' | 'MAIS' | 'PRO';
  status: string;
  provider?: string;
  provider_customer_id?: string;
}

/**
 * Valida o payload do webhook
 */
function validateWebhookPayload(payload: any): { valid: boolean; error?: string } {
  // Validar email
  if (!payload.email || typeof payload.email !== 'string') {
    return { valid: false, error: 'Campo "email" é obrigatório' };
  }

  // Validar formato básico de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  // Validar planCode
  if (!payload.planCode || typeof payload.planCode !== 'string') {
    return { valid: false, error: 'Campo "planCode" é obrigatório' };
  }

  const validPlanCodes = ['BASICO', 'MAIS', 'PRO'];
  if (!validPlanCodes.includes(payload.planCode.toUpperCase())) {
    return { valid: false, error: 'planCode deve ser BASICO, MAIS ou PRO' };
  }

  // Validar status
  if (!payload.status || typeof payload.status !== 'string') {
    return { valid: false, error: 'Campo "status" é obrigatório' };
  }

  return { valid: true };
}

/**
 * Cria cliente Supabase com Service Role Key (admin)
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Credenciais do Supabase não configuradas');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validar header de segurança
    const webhookSecret = request.headers.get('x-webhook-secret');
    
    if (!webhookSecret || webhookSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
      console.error('[WEBHOOK 3B] Tentativa de acesso não autorizado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // 2. Parsear payload
    const payload: WebhookPayload = await request.json();

    console.log('[WEBHOOK 3B] Webhook recebido:', {
      email: payload.email,
      planCode: payload.planCode,
      status: payload.status,
      provider: payload.provider,
    });

    // 3. Validar payload
    const validation = validateWebhookPayload(payload);
    
    if (!validation.valid) {
      console.error('[WEBHOOK 3B] Validação falhou:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('[WEBHOOK 3B] Webhook validado com sucesso');

    // 4. Verificar se status é "paid"
    if (payload.status.toLowerCase() !== 'paid') {
      console.log('[WEBHOOK 3B] Status não é "paid", ignorando atualização');
      return NextResponse.json(
        {
          ok: true,
          message: 'Webhook recebido, mas status não é "paid"',
        },
        { status: 200 }
      );
    }

    // 5. Conectar ao Supabase
    const supabase = getSupabaseAdmin();

    // 6. Buscar usuário pelo email
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios_temp')
      .select('id, email, nome')
      .eq('email', payload.email)
      .single();

    if (usuarioError || !usuario) {
      console.warn('[WEBHOOK 3B] Usuário não encontrado para webhook:', payload.email);
      return NextResponse.json(
        {
          ok: true,
          message: 'Usuário não encontrado, webhook ignorado',
        },
        { status: 200 }
      );
    }

    console.log('[WEBHOOK 3B] Usuário encontrado:', usuario.email);

    // 7. Buscar plano pelo código (case-insensitive)
    const { data: plano, error: planoError } = await supabase
      .from('planos')
      .select('id, nome, codigo')
      .ilike('codigo', payload.planCode)
      .single();

    if (planoError || !plano) {
      console.warn('[WEBHOOK 3B] Plano não encontrado no webhook:', payload.planCode);
      return NextResponse.json(
        {
          ok: true,
          message: 'Plano não encontrado, webhook ignorado',
        },
        { status: 200 }
      );
    }

    console.log('[WEBHOOK 3B] Plano encontrado:', plano.nome);

    // 8. Atualizar usuário com o novo plano
    const updateData: any = {
      plano_id: plano.id,
      subscription_status: 'active',
      provider: payload.provider || 'unknown',
      plan_valid_until: null, // Deixar null por enquanto
    };

    // Adicionar provider_customer_id se fornecido
    if (payload.provider_customer_id) {
      updateData.provider_customer_id = payload.provider_customer_id;
    }

    const { error: updateError } = await supabase
      .from('usuarios_temp')
      .update(updateData)
      .eq('id', usuario.id);

    if (updateError) {
      console.error('[WEBHOOK 3B] Erro ao atualizar usuário:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar plano do usuário' },
        { status: 500 }
      );
    }

    console.log('[WEBHOOK 3B] Plano atualizado com sucesso');
    console.log('[WEBHOOK 3B] Finalizado PARTE 3B');

    // 9. Retornar sucesso
    return NextResponse.json(
      {
        ok: true,
        message: 'Plano atualizado com sucesso (PARTE 3B)',
        data: {
          usuario_id: usuario.id,
          email: usuario.email,
          plano_nome: plano.nome,
          plano_codigo: plano.codigo,
          subscription_status: 'active',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[WEBHOOK 3B] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    );
  }
}

// Bloquear outros métodos HTTP
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST.' },
    { status: 405 }
  );
}
