import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Cliente Supabase com service role key (apenas server-side)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    // ✅ CRÍTICO: Obter user_id da sessão autenticada
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[API] Usuário não autenticado:', authError);
      return NextResponse.json(
        { error: 'Não autenticado. Faça login para salvar registros.' },
        { status: 401 }
      );
    }

    console.log('[API] Usuário autenticado:', user.id);

    // Parse do body
    const payload = await request.json();
    
    console.log('[API] Recebendo requisição para criar service record:', payload);

    // Validação básica dos campos obrigatórios
    const { vehicle_id, maintenance_item_key, odometer_at_service, service_date } = payload;
    
    if (!vehicle_id || !maintenance_item_key || !odometer_at_service || !service_date) {
      console.error('[API] Campos obrigatórios faltando:', { vehicle_id, maintenance_item_key, odometer_at_service, service_date });
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: vehicle_id, maintenance_item_key, odometer_at_service, service_date' },
        { status: 400 }
      );
    }

    // Deduplicação: verificar se já existe registro idêntico
    const { data: existingRecords, error: checkError } = await supabaseAdmin
      .from('service_records')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .eq('user_id', user.id) // ✅ Usar user_id da sessão
      .eq('maintenance_item_key', maintenance_item_key)
      .eq('odometer_at_service', odometer_at_service)
      .eq('service_date', service_date);

    if (checkError) {
      console.error('[API] Erro ao verificar duplicatas:', checkError);
      return NextResponse.json(
        { error: `Erro ao verificar duplicatas: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingRecords && existingRecords.length > 0) {
      console.log('[API] Registro duplicado detectado:', existingRecords[0]);
      return NextResponse.json(
        { error: 'Registro duplicado detectado' },
        { status: 409 }
      );
    }

    // ✅ Preparar dados para inserção COM user_id da sessão autenticada
    const recordToInsert: any = {
      user_id: user.id, // ✅ CRÍTICO: Usar user_id da sessão, não do payload
      vehicle_id,
      maintenance_item_key,
      odometer_at_service: parseInt(odometer_at_service),
      service_date,
      interval_used_km: payload.interval_used_km ? parseInt(payload.interval_used_km) : null,
      created_at: new Date().toISOString(),
    };

    // Tentar incluir cost - se falhar, remover do payload
    if (payload.cost !== undefined && payload.cost !== null) {
      recordToInsert.cost = parseFloat(payload.cost);
    }

    console.log('[API] Inserindo registro:', recordToInsert);

    // Inserir registro no Supabase
    const { data: insertedRecord, error: insertError } = await supabaseAdmin
      .from('service_records')
      .insert([recordToInsert])
      .select()
      .single();

    if (insertError) {
      console.error('[API] Erro ao inserir registro:', insertError);
      
      // Se erro é relacionado à coluna 'cost', tentar novamente SEM cost
      if (insertError.message.includes('cost') || insertError.message.includes('column')) {
        console.log('[API] Coluna cost não existe - tentando inserir sem cost...');
        
        // Remover cost do payload
        delete recordToInsert.cost;
        
        const { data: retryInsert, error: retryError } = await supabaseAdmin
          .from('service_records')
          .insert([recordToInsert])
          .select()
          .single();
        
        if (retryError) {
          console.error('[API] Erro ao inserir sem cost:', retryError);
          return NextResponse.json(
            { error: `Erro ao salvar registro: ${retryError.message}` },
            { status: 500 }
          );
        }
        
        console.log('[API] Registro inserido com sucesso (sem cost):', retryInsert);
        
        return NextResponse.json(
          { 
            success: true, 
            data: retryInsert,
            message: 'Registro salvo com sucesso',
            warning: 'Coluna cost não existe no banco. Execute: ALTER TABLE public.service_records ADD COLUMN IF NOT EXISTS cost numeric(12,2);'
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao salvar registro: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log('[API] Registro inserido com sucesso:', insertedRecord);

    return NextResponse.json(
      { 
        success: true, 
        data: insertedRecord,
        message: 'Registro salvo com sucesso'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Erro inesperado ao processar requisição:', error);
    return NextResponse.json(
      { error: `Erro inesperado: ${error.message}` },
      { status: 500 }
    );
  }
}
