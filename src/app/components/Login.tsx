'use client';

import { useState } from 'react';
import { Mail, User, Lock, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { cadastrarUsuario, fazerLogin } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface LoginProps {
  onLogin: (id: string, email: string, nome: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [modo, setModo] = useState<'login' | 'cadastro' | 'recuperar-senha'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Formatar telefone com máscara (XX) XXXXX-XXXX
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else if (numeros.length <= 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setTelefone(valorFormatado);
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!isSupabaseConfigured) {
      setErro('Configure as variáveis de ambiente do Supabase para usar o sistema de autenticação.');
      return;
    }

    if (!email) {
      setErro('Digite seu e-mail para recuperar a senha');
      return;
    }

    setCarregando(true);

    try {
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/reset-password`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        setErro(error.message || 'Erro ao enviar e-mail de recuperação');
      } else {
        setSucesso('Enviamos um link para redefinir sua senha. Verifique seu e-mail.');
        setEmail('');
      }
    } catch (error) {
      setErro('Erro ao processar solicitação');
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured) {
      setErro('Configure as variáveis de ambiente do Supabase para usar o sistema de autenticação.');
      return;
    }

    setCarregando(true);

    try {
      if (modo === 'cadastro') {
        // Validar telefone no cadastro
        const numerosApenas = telefone.replace(/\D/g, '');
        if (numerosApenas.length < 10 || numerosApenas.length > 11) {
          setErro('Digite um número de telefone válido com DDD');
          setCarregando(false);
          return;
        }

        // Cadastrar novo usuário
        const resultado = await cadastrarUsuario(email, senha, nome, telefone);
        
        if (resultado.success && resultado.usuario) {
          onLogin(resultado.usuario.id, resultado.usuario.email, resultado.usuario.nome);
        } else {
          setErro(resultado.error || 'Erro ao cadastrar usuário');
        }
      } else {
        // Fazer login
        const resultado = await fazerLogin(email, senha);
        
        if (resultado.success && resultado.usuario) {
          onLogin(resultado.usuario.id, resultado.usuario.email, resultado.usuario.nome);
        } else {
          setErro(resultado.error || 'E-mail ou senha incorretos');
        }
      }
    } catch (error) {
      setErro('Erro ao processar solicitação');
    } finally {
      setCarregando(false);
    }
  };

  // Renderizar tela de recuperação de senha
  if (modo === 'recuperar-senha') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl shadow-2xl p-8 border border-[#2A2A2A]">
          <button
            onClick={() => {
              setModo('login');
              setErro('');
              setSucesso('');
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
              Recuperar Senha
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Digite seu e-mail para receber o link de recuperação
            </p>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{sucesso}</span>
            </div>
          )}

          <form onSubmit={handleRecuperarSenha} className="space-y-5">
            <div>
              <label htmlFor="email-recuperar" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  id="email-recuperar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                  placeholder="Digite seu e-mail"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando || !isSupabaseConfigured}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl shadow-2xl p-8 border border-[#2A2A2A]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-black rounded-2xl shadow-2xl">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/d3e0f70c-8f3c-45bc-9f81-b88c43162ad5.png" 
                alt="Mecânico Digital" 
                className="w-[120px] h-[120px] object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
            Mecânico Digital
          </h1>
          <p className="text-gray-400 mt-2">
            Controle inteligente da manutenção do seu veículo
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-300">
                <p className="font-semibold mb-1">Configuração necessária</p>
                <p className="text-orange-400/90">
                  Configure as variáveis de ambiente do Supabase para usar o sistema de autenticação.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alternador Login/Cadastro */}
        <div className="flex gap-2 mb-6 bg-[#0F0F0F] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setModo('login');
              setErro('');
              setSucesso('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              modo === 'login'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setModo('cadastro');
              setErro('');
              setSucesso('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              modo === 'cadastro'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{sucesso}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {modo === 'cadastro' && (
            <>
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                    placeholder="Digite seu nome"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-2">
                  WhatsApp / Celular
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    type="tel"
                    id="telefone"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                    placeholder="(00) 00000-0000"
                    required
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Digite com DDD para contato via WhatsApp</p>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                placeholder="Digite seu e-mail"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                placeholder="Digite sua senha"
                required
                minLength={6}
              />
            </div>
            {modo === 'cadastro' && (
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            )}
          </div>

          {modo === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setModo('recuperar-senha');
                  setErro('');
                  setSucesso('');
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || !isSupabaseConfigured}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? 'Processando...' : modo === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          {modo === 'login' ? 'Novo por aqui?' : 'Já tem uma conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setModo(modo === 'login' ? 'cadastro' : 'login');
              setErro('');
              setSucesso('');
            }}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {modo === 'login' ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
}
