import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cliente Supabase com service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Verificar estrutura da tabela service_records
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('service_records')
      .select('*')
      .limit(1);

    if (columnsError) {
      return NextResponse.json({
        success: false,
        error: columnsError.message,
        message: 'Erro ao consultar tabela service_records',
      });
    }

    // Verificar se coluna 'cost' existe
    const hasCostColumn = columns && columns.length > 0 && 'cost' in columns[0];

    return NextResponse.json({
      success: true,
      message: 'Teste de estrutura da tabela service_records',
      hasCostColumn,
      sampleRecord: columns && columns.length > 0 ? columns[0] : null,
      availableColumns: columns && columns.length > 0 ? Object.keys(columns[0]) : [],
      instructions: !hasCostColumn ? 
        'Execute no Supabase SQL Editor: ALTER TABLE public.service_records ADD COLUMN IF NOT EXISTS cost numeric(12,2);' 
        : 'Coluna cost existe! Tudo pronto.',
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Erro inesperado ao testar estrutura',
    });
  }
}
