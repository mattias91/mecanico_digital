'use client';

import React, { useState, useEffect } from 'react';

export default function TestComponent() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setMounted(true);
    // Formatar hora manualmente para evitar problemas de hidratação
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}:${seconds}`);
  }, []);

  if (!mounted) {
    return (
      <div className="p-4 bg-green-100 text-green-800 rounded">
        ✅ Servidor funcionando - Carregando...
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 text-green-800 rounded">
      ✅ Servidor funcionando - Teste realizado às {currentTime}
    </div>
  );
}
