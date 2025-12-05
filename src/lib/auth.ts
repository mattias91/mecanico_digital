import { supabase, isSupabaseConfigured } from './supabase';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
}

// Cadastrar novo usuário
export async function cadastrarUsuario(email: string, senha: string, nome: string, telefone?: string) {
  try {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Configure as variáveis de ambiente do Supabase para usar o sistema de autenticação.',
      };
    }

    // 1. Criar usuário no Supabase Auth SEM confirmação de email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        // DESABILITAR confirmação de email para acesso imediato
        emailRedirectTo: undefined,
        data: {
          nome: nome,
          telefone: telefone,
        }
      }
    });

    // Verificar se o erro é de usuário já registrado
    if (authError) {
      if (authError.message.includes('User already registered') || 
          authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'Este email já está cadastrado. Faça login ou use outro email.',
        };
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Erro ao criar usuário');

    // 2. Criar registro na tabela usuarios_temp (com coluna telefone)
    const { error: dbError } = await supabase
      .from('usuarios_temp')
      .insert({
        id: authData.user.id,
        email,
        nome,
        telefone: telefone || null,
      });

    if (dbError) throw dbError;

    // 3. IMPORTANTE: Fazer login automático após cadastro
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (sessionError) {
      console.warn('Aviso: Cadastro criado mas login automático falhou:', sessionError);
    }

    return {
      success: true,
      usuario: {
        id: authData.user.id,
        email,
        nome,
        telefone,
      },
      mensagem: 'Cadastro realizado com sucesso! Você já está logado.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao cadastrar usuário',
    };
  }
}

// Fazer login
export async function fazerLogin(email: string, senha: string) {
  try {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Configure as variáveis de ambiente do Supabase para usar o sistema de autenticação.',
      };
    }

    // 1. Autenticar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError) {
      // Mensagem mais amigável para erro de credenciais
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos. Verifique seus dados e tente novamente.');
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Erro ao fazer login');

    // 2. Buscar dados do usuário na tabela usuarios_temp primeiro
    let userData = null;

    // Tentar buscar em usuarios_temp (nova tabela com telefone)
    const tempResult = await supabase
      .from('usuarios_temp')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (tempResult.data) {
      userData = tempResult.data;
    } else {
      // Fallback: buscar na tabela usuarios antiga
      const oldResult = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (oldResult.error) throw oldResult.error;
      userData = oldResult.data;

      // Migrar usuário para nova tabela
      await supabase
        .from('usuarios_temp')
        .insert({
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          telefone: null,
          created_at: userData.created_at,
        });
    }

    return {
      success: true,
      usuario: {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        telefone: userData.telefone || undefined,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao fazer login',
    };
  }
}

// Fazer logout
export async function fazerLogout() {
  try {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao fazer logout',
    };
  }
}

// Verificar sessão atual
export async function verificarSessao() {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, usuario: null };
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!session) return { success: false, usuario: null };

    // Buscar dados do usuário em usuarios_temp primeiro
    let userData = null;

    const tempResult = await supabase
      .from('usuarios_temp')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (tempResult.data) {
      userData = tempResult.data;
    } else {
      // Fallback: buscar na tabela usuarios antiga
      const oldResult = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (oldResult.error) throw oldResult.error;
      userData = oldResult.data;

      // Migrar usuário para nova tabela
      await supabase
        .from('usuarios_temp')
        .insert({
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          telefone: null,
          created_at: userData.created_at,
        });
    }

    return {
      success: true,
      usuario: {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        telefone: userData.telefone || undefined,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      usuario: null,
      error: error.message,
    };
  }
}
