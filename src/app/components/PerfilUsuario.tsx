'use client';

import { useState } from 'react';
import { User, Eye, EyeOff, LogOut, Car, Save } from 'lucide-react';
import { fazerLogout } from '@/lib/auth';
import { Veiculo } from '@/lib/types';

interface PerfilUsuarioProps {
  usuario: { id: string; email: string; nome: string };
  veiculo: Veiculo;
}

export default function PerfilUsuario({ usuario, veiculo }: PerfilUsuarioProps) {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [placa, setPlaca] = useState(veiculo.placa || '');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  const handleLogout = async () => {
    await fazerLogout();
    window.location.reload();
  };

  const handleSalvarPlaca = async () => {
    setSalvando(true);
    
    // Simula salvamento (aqui você pode adicionar a lógica real de salvamento)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSalvando(false);
    setMensagemSucesso(true);
    
    // Remove mensagem de sucesso após 3 segundos
    setTimeout(() => {
      setMensagemSucesso(false);
    }, 3000);
  };

  return (
    <>
      {/* Botão de Perfil */}
      <div className="relative">
        <button
          onClick={() => setMostrarMenu(!mostrarMenu)}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/40 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
        >
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
        </button>

        {/* Menu Dropdown com Rolagem */}
        {mostrarMenu && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            {/* Cabeçalho do Perfil */}
            <div className="p-5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-b border-[#2A2A2A] sticky top-0 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{usuario.nome}</p>
                  <p className="text-xs text-gray-400">Perfil do Usuário</p>
                </div>
              </div>
            </div>

            {/* Dados do Usuário */}
            <div className="p-5 border-b border-[#2A2A2A]">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-400" />
                Dados Cadastrados
              </h3>
              
              {/* Email */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 mb-1 block">E-mail</label>
                <div className="px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                  <p className="text-sm text-gray-300">{usuario.email}</p>
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Senha</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                    <p className="text-sm text-gray-300">
                      {mostrarSenha ? '********' : '••••••••'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {mostrarSenha ? 'Senha visível' : 'Clique no ícone para visualizar'}
                </p>
              </div>
            </div>

            {/* Informações do Veículo */}
            <div className="p-5 border-b border-[#2A2A2A]">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Car className="h-4 w-4 text-green-400" />
                Veículo Cadastrado
              </h3>
              
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-base font-bold text-white">
                      {veiculo.marca} {veiculo.modelo}
                    </p>
                    <p className="text-sm text-gray-400">Ano {veiculo.ano}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-400">Ativo</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="bg-[#0F0F0F] rounded-lg p-3 border border-[#2A2A2A]">
                    <label className="text-xs text-gray-500 block mb-1">Placa do Veículo</label>
                    <input
                      type="text"
                      placeholder="Digite a placa"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      maxLength={7}
                      className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-gray-600"
                    />
                  </div>
                  
                  {/* Botão Salvar Placa */}
                  <button
                    onClick={handleSalvarPlaca}
                    disabled={salvando || !placa.trim()}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-green-500/50"
                  >
                    <Save className="h-4 w-4" />
                    <span className="text-sm">
                      {salvando ? 'Salvando...' : 'Salvar Placa'}
                    </span>
                  </button>

                  {/* Mensagem de Sucesso */}
                  {mensagemSucesso && (
                    <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-xs text-green-400 text-center font-medium">
                        ✓ Placa salva com sucesso!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botão de Logout */}
            <div className="p-3 sticky bottom-0 bg-[#1A1A1A]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all duration-300 font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sair da Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay para fechar menu */}
      {mostrarMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setMostrarMenu(false)}
        />
      )}
    </>
  );
}
