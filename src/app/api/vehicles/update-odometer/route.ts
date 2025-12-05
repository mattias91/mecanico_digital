import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase com Service Role Key (apenas server-side)
const getSupabaseAdmin = () => {
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
};

export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autorizado — token ausente' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();

    // Verificar token do usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return NextResponse.json(
        { error: 'Não autorizado — token inválido' },
        { status: 401 }
      );
    }

    // Receber dados do body
    const body = await request.json();
    const { vehicle_id, newOdometer, reason } = body;

    if (!vehicle_id || newOdometer === undefined) {
      return NextResponse.json(
        { error: 'Dados incompletos — vehicle_id e newOdometer são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar veículo atual
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('veiculos')
      .select('id, km_atual, id_usuario')
      .eq('id', vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Erro ao buscar veículo:', vehicleError);
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é dono do veículo
    if (vehicle.id_usuario !== user.id) {
      return NextResponse.json(
        { error: 'Não autorizado — você não é dono deste veículo' },
        { status: 403 }
      );
    }

    const oldValue = vehicle.km_atual;
    const isReduction = newOdometer < oldValue;

    // Se for redução, validar motivo obrigatório
    if (isReduction) {
      if (!reason || reason.trim() === '') {
        return NextResponse.json(
          { error: 'Motivo obrigatório para redução de odômetro' },
          { status: 400 }
        );
      }

      // Registrar na tabela de auditoria
      const { error: auditError } = await supabaseAdmin
        .from('odometer_changes')
        .insert({
          user_id: user.id,
          vehicle_id: vehicle_id,
          old_value: oldValue,
          new_value: newOdometer,
          reason: reason.trim(),
          method: 'manual',
        });

      if (auditError) {
        console.error('Erro ao registrar auditoria:', auditError);
        return NextResponse.json(
          { error: 'Erro ao registrar auditoria da alteração' },
          { status: 500 }
        );
      }

      console.log(`✅ Redução de odômetro registrada: ${oldValue} → ${newOdometer} km (Motivo: ${reason})`);
    }

    // Atualizar odômetro do veículo
    const { data: updatedVehicle, error: updateError } = await supabaseAdmin
      .from('veiculos')
      .update({ km_atual: newOdometer })
      .eq('id', vehicle_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar veículo:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar quilometragem' },
        { status: 500 }
      );
    }

    console.log(`✅ Odômetro atualizado: ${oldValue} → ${newOdometer} km`);

    return NextResponse.json({
      ok: true,
      message: isReduction 
        ? 'Quilometragem reduzida com sucesso — motivo registrado'
        : 'Quilometragem atualizada com sucesso',
      vehicle: updatedVehicle,
    });

  } catch (error) {
    console.error('Erro no endpoint update-odometer:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
