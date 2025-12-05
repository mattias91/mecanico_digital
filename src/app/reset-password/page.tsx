'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Mail } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function parseHash(hash: string) {
  if (!hash) return {};
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(cleaned);
  const obj: Record<string, string> = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verificando link...');
  const [tokenVerified, setTokenVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailForResend, setEmailForResend] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('Configure as variáveis de ambiente do Supabase.');
      setShowResend(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const code = params.get('code');
    const type = params.get('type') || 'recovery';

    const hashParams = parseHash(window.location.hash);
    const hashError = hashParams.error;
    const hashErrorCode = hashParams.error_code;
    const hashCode = hashParams.code;
    const hashToken = hashParams.token_hash || hashParams.token;
    const accessToken = hashParams.access_token;
    const refreshToken = hashParams.refresh_token;

    // Tratamento de erros no hash
    if (hashError) {
      if (hashErrorCode === 'otp_expired') {
        setStatus('Este link expirou. Solicite um novo link abaixo.');
        setShowResend(true);
        return;
      }
      setStatus(hashParams.error_description || 'Erro desconhecido no link.');
      setShowResend(true);
      return;
    }

    // Verificar se há tokens disponíveis
    if (!tokenHash && !code && !hashToken && !hashCode && !accessToken) {
      setStatus('Link inválido. Solicite um novo e-mail para redefinir sua senha.');
      setShowResend(true);
      return;
    }

    (async () => {
      try {
        // PRIORIDADE 1: Magic link com access_token e refresh_token no hash
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setStatus('Erro ao criar sessão: ' + error.message);
            setShowResend(true);
            return;
          }
          setTokenVerified(true);
          setStatus('Sessão criada com sucesso. Digite sua nova senha.');
          return;
        }

        // PRIORIDADE 2: token_hash (query string ou hash)
        if (tokenHash || hashToken) {
          const th = tokenHash || hashToken;
          const { error } = await supabase.auth.verifyOtp({ token_hash: th, type });
          if (error) {
            setStatus('Erro ao verificar link: ' + error.message);
            setShowResend(true);
            return;
          }
          setTokenVerified(true);
          setStatus('Token verificado. Digite sua nova senha.');
          return;
        }

        // PRIORIDADE 3: code (query string ou hash)
        if (code || hashCode) {
          const c = code || hashCode;
          const { error } = await supabase.auth.exchangeCodeForSession(c);
          if (error) {
            setStatus('Erro ao validar link: ' + error.message);
            setShowResend(true);
            return;
          }
          setTokenVerified(true);
          setStatus('Sessão criada. Digite sua nova senha.');
          return;
        }
      } catch (err: any) {
        setStatus('Erro inesperado: ' + err.message);
        setShowResend(true);
      }
    })();
  }, []);

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setStatus('Atualizando senha...');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus('Erro ao atualizar senha: ' + error.message);
      setError(error.message);
      setLoading(false);
      return;
    }

    setStatus('Senha atualizada com sucesso! Redirecionando...');
    setTimeout(() => router.push('/'), 1500);
  }

  async function resendReset() {
    if (!emailForResend) {
      setError('Digite seu e-mail.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailForResend, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError('Erro: ' + error.message);
      setLoading(false);
      return;
    }

    setError('');
    setStatus('Novo link enviado! Verifique o e-mail.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl shadow-2xl p-8 border border-[#2A2A2A]">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
            Redefinir Senha
          </h1>
          <p className="text-gray-400 mt-2 text-sm">{status}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {tokenVerified && (
          <form onSubmit={submitNewPassword} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  id="new-password"
                  placeholder="Digite sua nova senha"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo de 8 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Atualizando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        {showResend && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-[#2A2A2A] pt-6">
              <p className="text-sm text-gray-400 mb-4 text-center">
                Reenviar link de recuperação:
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={emailForResend}
                    onChange={(e) => setEmailForResend(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={resendReset}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Reenviar link'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Voltar para login
          </button>
        </div>
      </div>
    </div>
  );
}
