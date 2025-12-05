'use client';

import { useState } from 'react';
import { Car, Bike, LogOut, Loader2 } from 'lucide-react';
import { TipoVeiculo, Veiculo } from '@/lib/types';
import { fazerLogout } from '@/lib/auth';

interface CadastroVeiculoProps {
  onCadastro: (veiculo: Omit<Veiculo, 'id' | 'id_usuario'>) => Promise<void>;
  usuario?: { id: string; email: string; nome: string } | null;
}

export default function CadastroVeiculo({ onCadastro, usuario }: CadastroVeiculoProps) {
  const [tipo, setTipo] = useState<TipoVeiculo>('carro');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [tipoOleo, setTipoOleo] = useState('5W-30');
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (marca && modelo && ano && kmAtual && tipoOleo) {
      setSalvando(true);
      
      try {
        await onCadastro({
          tipo,
          marca,
          modelo,
          ano: parseInt(ano),
          km_atual: parseInt(kmAtual),
          tipo_oleo: tipoOleo,
        });
      } catch (error) {
        console.error('Erro ao cadastrar veículo:', error);
        alert('Erro ao cadastrar veículo. Tente novamente.');
      } finally {
        setSalvando(false);
      }
    }
  };

  const handleLogout = async () => {
    await fazerLogout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0F0F0F] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header com informações do usuário */}
        {usuario && (
          <div className="mb-6 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-xl p-4 border border-[#2A2A2A] flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Logado como</p>
              <p className="text-white font-semibold">{usuario.nome}</p>
              <p className="text-xs text-gray-500">{usuario.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}

        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-2xl shadow-2xl p-8 border border-[#2A2A2A]">
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
              Cadastro do Veículo
            </h1>
            <p className="text-gray-400 mt-2">Preencha as informações do seu veículo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo do Veículo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tipo do Veículo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipo('carro')}
                  disabled={salvando}
                  className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    tipo === 'carro'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/20'
                      : 'border-[#2A2A2A] hover:border-[#3A3A3A] text-gray-400'
                  } ${salvando ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Car className="h-6 w-6 mr-2" />
                  Carro
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('moto')}
                  disabled={salvando}
                  className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    tipo === 'moto'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/20'
                      : 'border-[#2A2A2A] hover:border-[#3A3A3A] text-gray-400'
                  } ${salvando ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Bike className="h-6 w-6 mr-2" />
                  Moto
                </button>
              </div>
            </div>

            {/* Marca e Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="marca" className="block text-sm font-medium text-gray-300 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  id="marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  disabled={salvando}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ex: Toyota"
                  required
                />
              </div>
              <div>
                <label htmlFor="modelo" className="block text-sm font-medium text-gray-300 mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  disabled={salvando}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ex: Corolla"
                  required
                />
              </div>
            </div>

            {/* Ano e KM Atual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ano" className="block text-sm font-medium text-gray-300 mb-2">
                  Ano
                </label>
                <input
                  type="number"
                  id="ano"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  disabled={salvando}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ex: 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              <div>
                <label htmlFor="kmAtual" className="block text-sm font-medium text-gray-300 mb-2">
                  Quilometragem Atual
                </label>
                <input
                  type="number"
                  id="kmAtual"
                  value={kmAtual}
                  onChange={(e) => setKmAtual(e.target.value)}
                  disabled={salvando}
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ex: 45000"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Tipo de Óleo */}
            <div>
              <label htmlFor="tipoOleo" className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Óleo do Motor
              </label>
              <select
                id="tipoOleo"
                value={tipoOleo}
                onChange={(e) => setTipoOleo(e.target.value)}
                disabled={salvando}
                className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="0W-20">0W-20 (Sintético - Alta Performance)</option>
                <option value="5W-20">5W-20 (Sintético)</option>
                <option value="5W-30">5W-30 (Sintético - Mais Comum)</option>
                <option value="5W-40">5W-40 (Sintético)</option>
                <option value="10W-30">10W-30 (Semissintético)</option>
                <option value="10W-40">10W-40 (Semissintético)</option>
                <option value="15W-40">15W-40 (Mineral)</option>
                <option value="20W-50">20W-50 (Mineral - Motores Antigos)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Consulte o manual do proprietário para o tipo recomendado
              </p>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Veículo'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
