import { supabase, isSupabaseConfigured } from './supabase';
import { Veiculo, Manutencao, IntervaloManutencao, INTERVALOS_PADRAO } from './types';

// ============= VEÍCULOS =============

export async function salvarVeiculo(veiculo: Omit<Veiculo, 'id'>) {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

    const { data, error } = await supabase
      .from('veiculos')
      .insert(veiculo)
      .select()
      .single();

    if (error) throw error;
    return { success: true, veiculo: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function buscarVeiculoDoUsuario(idUsuario: string) {
  try {
    if (!isSupabaseConfigured) {
      return { success: true, veiculo: null };
    }

    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id_usuario', idUsuario)
      .single();

    if (error) {
      // Se não encontrou veículo, não é erro
      if (error.code === 'PGRST116') {
        return { success: true, veiculo: null };
      }
      throw error;
    }

    return { success: true, veiculo: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function atualizarVeiculo(id: string, dados: Partial<Veiculo>) {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

    const { data, error } = await supabase
      .from('veiculos')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, veiculo: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============= MANUTENÇÕES =============

export async function salvarManutencao(manutencao: Omit<Manutencao, 'id'>) {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

    const { data, error } = await supabase
      .from('manutencoes')
      .insert(manutencao)
      .select()
      .single();

    if (error) throw error;
    return { success: true, manutencao: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function buscarManutencoes(idVeiculo: string) {
  try {
    if (!isSupabaseConfigured) {
      return { success: true, manutencoes: [] };
    }

    const { data, error } = await supabase
      .from('manutencoes')
      .select('*')
      .eq('id_veiculo', idVeiculo)
      .order('data', { ascending: false });

    if (error) throw error;
    return { success: true, manutencoes: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletarManutencao(id: string) {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

    const { error } = await supabase
      .from('manutencoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============= INTERVALOS DE MANUTENÇÃO =============

export async function salvarIntervalos(idUsuario: string, intervalos: IntervaloManutencao) {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Configure as variáveis de ambiente.');
    }

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('intervalos_manutencao')
      .select('id')
      .eq('id_usuario', idUsuario)
      .single();

    if (existente) {
      // Atualizar
      const { error } = await supabase
        .from('intervalos_manutencao')
        .update(intervalos)
        .eq('id_usuario', idUsuario);

      if (error) throw error;
    } else {
      // Inserir
      const { error } = await supabase
        .from('intervalos_manutencao')
        .insert({
          id_usuario: idUsuario,
          ...intervalos,
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function buscarIntervalos(idUsuario: string) {
  try {
    if (!isSupabaseConfigured) {
      return { success: true, intervalos: INTERVALOS_PADRAO };
    }

    const { data, error } = await supabase
      .from('intervalos_manutencao')
      .select('*')
      .eq('id_usuario', idUsuario)
      .single();

    if (error) {
      // Se não encontrou, retornar intervalos padrão
      if (error.code === 'PGRST116') {
        return { success: true, intervalos: INTERVALOS_PADRAO };
      }
      throw error;
    }

    // Remover campos do banco que não fazem parte do IntervaloManutencao
    const { id, id_usuario, created_at, ...intervalos } = data;

    return { success: true, intervalos: intervalos as IntervaloManutencao };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
