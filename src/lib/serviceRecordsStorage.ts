// Gerenciamento de registros de serviço APENAS com Supabase (SEM localStorage)

import { supabase } from './supabase';

export interface ServiceRecord {
  id: string;
  user_id?: string;
  vehicle_id?: string;
  maintenance_item_key: string;
  odometer_at_service: number;
  service_date: string;
  interval_used_km?: number;
  notes?: string;
  cost?: number;
  synced: boolean;
  created_at: string;
}

export interface CardUpdateData {
  last_service_km: number;
  next_due_km: number;
  remaining_km: number;
  cost?: number;
  status: 'ok' | 'proximo' | 'atrasado';
  synced: boolean;
  service_date?: string;
}

// ✅ CORREÇÃO CRÍTICA: Obter sessão válida com refresh automático
async function getValidSession(): Promise<{ accessToken: string; userId: string } | null> {
  try {
    // Primeiro, tentar refresh da sessão
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (!refreshError && session?.access_token && session?.user?.id) {
      console.log('✅ Sessão refreshed com sucesso');
      return {
        accessToken: session.access_token,
        userId: session.user.id
      };
    }

    // Se refresh falhar, tentar getSession
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession?.access_token && currentSession?.user?.id) {
      console.log('✅ Sessão atual válida');
      return {
        accessToken: currentSession.access_token,
        userId: currentSession.user.id
      };
    }

    // Última tentativa: getUser
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.id) {
      // Tentar pegar sessão novamente após getUser
      const { data: { session: finalSession } } = await supabase.auth.getSession();
      
      if (finalSession?.access_token) {
        console.log('✅ Sessão obtida após getUser');
        return {
          accessToken: finalSession.access_token,
          userId: user.id
        };
      }
    }

    console.warn('⚠️ Não foi possível obter sessão válida');
    return null;
  } catch (error) {
    console.error('❌ Erro ao obter sessão:', error);
    return null;
  }
}

// ✅ CORREÇÃO: Buscar APENAS do Supabase (sem localStorage)
export async function getServiceRecords(vehicleId?: string): Promise<ServiceRecord[]> {
  if (!vehicleId) {
    console.warn('⚠️ vehicleId não fornecido - retornando array vazio');
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('⚠️ Usuário não autenticado');
      return [];
    }

    const { data, error } = await supabase
      .from('service_records')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user.id)
      .order('odometer_at_service', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar registros:', error);
      return [];
    }

    return (data || []).map(r => ({
      ...r,
      synced: true,
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar registros:', error);
    return [];
  }
}

// Obter ÚLTIMO registro por maintenance_item_key (DISTINCT ON logic)
export async function getLastRecordsByKey(vehicleId: string): Promise<Record<string, ServiceRecord>> {
  const allRecords = await getServiceRecords(vehicleId);
  
  // Agrupar por maintenance_item_key e pegar o último (maior odometer)
  const lastRecordsByKey: Record<string, ServiceRecord> = {};
  
  allRecords.forEach(record => {
    const key = record.maintenance_item_key;
    const existing = lastRecordsByKey[key];
    
    if (!existing || record.odometer_at_service > existing.odometer_at_service) {
      lastRecordsByKey[key] = record;
    }
  });
  
  return lastRecordsByKey;
}

// Aplicar atualização de um único registro para calcular dados do card
export function applySingleRecordUpdate(
  record: ServiceRecord,
  currentOdometer: number,
  defaultInterval: number = 10000
): CardUpdateData {
  const intervalKm = record.interval_used_km || defaultInterval;
  const lastServiceKm = record.odometer_at_service;
  const nextDueKm = lastServiceKm + intervalKm;
  const remainingKm = nextDueKm - currentOdometer;
  
  // Determinar status
  let status: 'ok' | 'proximo' | 'atrasado';
  if (remainingKm < 0) {
    status = 'atrasado';
  } else if (remainingKm <= intervalKm * 0.2) {
    status = 'proximo';
  } else {
    status = 'ok';
  }
  
  return {
    last_service_km: lastServiceKm,
    next_due_km: nextDueKm,
    remaining_km: remainingKm,
    cost: record.cost,
    status,
    synced: record.synced,
    service_date: record.service_date,
  };
}

// ✅ CORREÇÃO PRINCIPAL: Salvar DIRETO no Supabase via API (sem localStorage)
export async function saveServiceRecord(
  record: Omit<ServiceRecord, 'id' | 'created_at' | 'synced'>,
  vehicleId: string
): Promise<ServiceRecord | null> {
  // ✅ VALIDAÇÃO CRÍTICA: Garantir que vehicleId não seja null/undefined
  if (!vehicleId) {
    throw new Error('vehicleId é obrigatório para salvar registro');
  }

  console.log('📝 Salvando registro com vehicle_id:', vehicleId);
  
  try {
    const session = await getValidSession();
    
    if (!session) {
      throw new Error('Sessão inválida - faça login novamente');
    }

    const payload = {
      vehicle_id: vehicleId,
      maintenance_item_key: record.maintenance_item_key,
      odometer_at_service: record.odometer_at_service,
      service_date: record.service_date,
      interval_used_km: record.interval_used_km,
      cost: record.cost || 0,
      notes: record.notes,
    };

    console.log('📤 Salvando no Supabase via API...');

    const response = await fetch('/api/service-records/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Registro salvo com sucesso:', result.data.id);
      return {
        ...result.data,
        synced: true,
      };
    } else if (response.status === 409) {
      console.log('⚠️ Registro duplicado - já existe no banco');
      // Buscar o registro existente
      const records = await getServiceRecords(vehicleId);
      const existing = records.find(
        r => r.maintenance_item_key === record.maintenance_item_key &&
             r.odometer_at_service === record.odometer_at_service
      );
      return existing || null;
    } else {
      throw new Error(result.error || 'Erro ao salvar registro');
    }
  } catch (error: any) {
    console.error('❌ Erro ao salvar registro:', error);
    throw error;
  }
}

// Obter último registro de um tipo específico
export async function getLastServiceRecord(
  maintenanceKey: string,
  vehicleId?: string
): Promise<ServiceRecord | null> {
  if (!vehicleId) {
    console.warn('⚠️ vehicleId não fornecido');
    return null;
  }
  
  const lastRecordsByKey = await getLastRecordsByKey(vehicleId);
  return lastRecordsByKey[maintenanceKey] || null;
}

// ✅ REMOVIDO: Funções de localStorage (getLocalRecords, saveLocalRecord, etc.)
// ✅ REMOVIDO: Funções de pending records (savePendingLocal, getPendingRecords, etc.)
// ✅ REMOVIDO: Funções de sincronização (syncLocalRecordsToSupabase, markAsSynced, etc.)

// Gerar documentação de backend
export function generateBackendDocs(): void {
  if (typeof window === 'undefined') return;
  
  const docs = `# Documentação de Backend - Registros de Serviço

## Endpoint Implementado

### POST /api/service-records/create

Salva um novo registro de serviço de manutenção.

**Headers:**
\`\`\`
Authorization: Bearer {access_token}
Content-Type: application/json
\`\`\`

**Payload:**
\`\`\`json
{
  "vehicle_id": "uuid",
  "maintenance_item_key": "oil",
  "odometer_at_service": 100000,
  "service_date": "2025-01-25",
  "interval_used_km": 9000,
  "notes": "Troca feita na oficina X",
  "cost": 150.00
}
\`\`\`

**Resposta de Sucesso (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "vehicle_id": "uuid",
    "maintenance_item_key": "oil",
    "odometer_at_service": 100000,
    "service_date": "2025-01-25",
    "interval_used_km": 9000,
    "cost": 150.00,
    "created_at": "2025-01-25T10:00:00Z"
  },
  "message": "Registro salvo com sucesso"
}
\`\`\`

**Resposta de Duplicado (409):**
\`\`\`json
{
  "error": "Registro duplicado detectado"
}
\`\`\`

**SQL Sugerido (PostgreSQL):**
\`\`\`sql
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vehicle_id UUID NOT NULL,
  maintenance_item_key VARCHAR(50) NOT NULL,
  odometer_at_service INTEGER NOT NULL,
  service_date DATE NOT NULL,
  interval_used_km INTEGER,
  notes TEXT,
  cost DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_records_vehicle ON service_records(vehicle_id);
CREATE INDEX idx_service_records_maintenance ON service_records(maintenance_item_key);
CREATE INDEX idx_service_records_user ON service_records(user_id);
\`\`\`

## Notas

- Endpoint implementado em: src/app/api/service-records/create/route.ts
- Usa Bearer token para autenticação
- Deduplicação automática antes de inserir
- Todos os dados salvos diretamente no Supabase
`;

  const blob = new Blob([docs], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'backend_integration_guide.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
