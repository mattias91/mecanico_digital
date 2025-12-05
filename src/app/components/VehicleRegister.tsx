'use client';

import { useState } from 'react';
import { Car, Bike, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle, VehicleType } from '@/lib/types';

interface VehicleRegisterProps {
  onRegister: (vehicle: Vehicle) => void;
}

export default function VehicleRegister({ onRegister }: VehicleRegisterProps) {
  const [tipo, setTipo] = useState<VehicleType>('carro');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [tipoOleo, setTipoOleo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vehicle: Vehicle = {
      id: Date.now().toString(),
      id_usuario: 'user-1',
      tipo,
      marca,
      modelo,
      ano: parseInt(ano),
      km_atual: parseInt(kmAtual),
      tipo_oleo: tipoOleo,
    };

    onRegister(vehicle);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0057FF] to-[#0041CC] px-4 py-8">
      <Card className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#333333] mb-2">Cadastre seu Veículo</h1>
          <p className="text-gray-600">Preencha as informações para começar o controle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Veículo */}
          <div className="space-y-3">
            <Label className="text-[#333333] font-semibold">Tipo de Veículo</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTipo('carro')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  tipo === 'carro'
                    ? 'border-[#0057FF] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Car className={`w-12 h-12 mx-auto mb-2 ${tipo === 'carro' ? 'text-[#0057FF]' : 'text-gray-400'}`} />
                <p className={`font-semibold ${tipo === 'carro' ? 'text-[#0057FF]' : 'text-gray-600'}`}>
                  Carro
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTipo('moto')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  tipo === 'moto'
                    ? 'border-[#0057FF] bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Bike className={`w-12 h-12 mx-auto mb-2 ${tipo === 'moto' ? 'text-[#0057FF]' : 'text-gray-400'}`} />
                <p className={`font-semibold ${tipo === 'moto' ? 'text-[#0057FF]' : 'text-gray-600'}`}>
                  Moto
                </p>
              </button>
            </div>
          </div>

          {/* Marca e Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca" className="text-[#333333]">Marca</Label>
              <Input
                id="marca"
                placeholder="Ex: Toyota, Honda"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo" className="text-[#333333]">Modelo</Label>
              <Input
                id="modelo"
                placeholder="Ex: Corolla, Civic"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                required
              />
            </div>
          </div>

          {/* Ano e Quilometragem */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano" className="text-[#333333]">Ano</Label>
              <Input
                id="ano"
                type="number"
                placeholder="Ex: 2020"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km" className="text-[#333333]">Quilometragem Atual</Label>
              <Input
                id="km"
                type="number"
                placeholder="Ex: 50000"
                value={kmAtual}
                onChange={(e) => setKmAtual(e.target.value)}
                className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
                min="0"
                required
              />
            </div>
          </div>

          {/* Tipo de Óleo */}
          <div className="space-y-2">
            <Label htmlFor="oleo" className="text-[#333333]">Tipo de Óleo (Opcional)</Label>
            <Input
              id="oleo"
              placeholder="Ex: 5W30, 10W40"
              value={tipoOleo}
              onChange={(e) => setTipoOleo(e.target.value)}
              className="h-12 border-gray-300 focus:border-[#0057FF] focus:ring-[#0057FF]"
            />
          </div>

          {/* Foto (Placeholder) */}
          <div className="space-y-2">
            <Label className="text-[#333333]">Foto do Veículo (Opcional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#0057FF] transition-colors cursor-pointer">
              <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Clique para adicionar uma foto</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#0057FF] hover:bg-[#0041CC] text-white font-semibold text-lg rounded-lg transition-all duration-300 hover:shadow-lg"
          >
            Cadastrar Veículo
          </Button>
        </form>
      </Card>
    </div>
  );
}
