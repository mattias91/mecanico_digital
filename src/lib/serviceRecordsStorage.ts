// Gerenciamento de registros de serviço com Supabase + fallback local

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

const STORAGE_KEY = 'service_records';
const PENDING_KEY = 'pending_service_records';

// Verificar se está no cliente
const isClient = typeof window !== 'undefined';

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

// Obter todos os registros (local + Supabase)
export async function getServiceRecords(vehicleId?: string): Promise<ServiceRecord[]> {
  const localRecords = getLocalRecords();
  
  // Tentar buscar registros remotos se tiver vehicleId
  if (vehicleId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('service_records')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .eq('user_id', user.id)
          .order('odometer_at_service', { ascending: false });
        
        if (!error && data) {
          const remoteRecords = data.map(r => ({
            ...r,
            synced: true,
          }));
          
          const unsyncedLocal = localRecords.filter(r => !r.synced);
          return [...remoteRecords, ...unsyncedLocal];
        }
      }
    } catch {
      // Silenciosamente usar apenas registros locais
    }
  }
  
  return localRecords;
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

// Obter registros locais
function getLocalRecords(): ServiceRecord[] {
  if (!isClient) return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao ler registros locais:', error);
    return [];
  }
}

// Salvar registro local
function saveLocalRecord(record: ServiceRecord): void {
  if (!isClient) return;
  
  try {
    const records = getLocalRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Erro ao salvar registro local:', error);
  }
}

// Salvar registro pendente localmente (fallback quando Supabase falha)
export function savePendingLocal(payload: Omit<ServiceRecord, 'id' | 'created_at' | 'synced'>): ServiceRecord {
  if (!isClient) {
    throw new Error('savePendingLocal só pode ser usado no cliente');
  }

  const pendingRecord: ServiceRecord = {
    ...payload,
    id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    synced: false,
  };

  try {
    const pending = getPendingRecords();
    pending.push(pendingRecord);
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    
    // Também salvar no storage principal
    saveLocalRecord(pendingRecord);
    
    console.log('💾 Registro salvo localmente (pendente):', pendingRecord.id);
    return pendingRecord;
  } catch (error) {
    console.error('Erro ao salvar registro pendente:', error);
    throw error;
  }
}

// Obter registros pendentes (não sincronizados)
export function getPendingRecords(): ServiceRecord[] {
  if (!isClient) return [];
  
  try {
    const data = localStorage.getItem(PENDING_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao ler registros pendentes:', error);
    return [];
  }
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

// ✅ CORREÇÃO PRINCIPAL: Salvar registro com fallback automático e modo offline inteligente
export async function saveServiceRecord(
  record: Omit<ServiceRecord, 'id' | 'created_at' | 'synced'>,
  vehicleId: string
): Promise<ServiceRecord | null> {
  // ✅ VALIDAÇÃO CRÍTICA: Garantir que vehicleId não seja null/undefined
  if (!vehicleId) {
    throw new Error('vehicleId é obrigatório para salvar registro');
  }

  console.log('📝 Salvando registro com vehicle_id:', vehicleId);
  
  // ✅ MODO OFFLINE INTELIGENTE: Sempre salvar localmente primeiro
  const localRecord: ServiceRecord = {
    ...record,
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    synced: false,
  };
  
  saveLocalRecord(localRecord);
  console.log('💾 Registro salvo localmente (modo offline)');
  
  // ✅ Tentar sincronizar com Supabase em background (não bloqueia o usuário)
  (async () => {
    try {
      const session = await getValidSession();
      
      if (!session) {
        console.warn('⚠️ Sessão inválida - registro permanecerá local até próxima sincronização');
        return;
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

      console.log('📤 Tentando sincronizar com Supabase...');

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
        // Marcar como sincronizado
        markAsSynced(localRecord.id);
        console.log('✅ Registro sincronizado com sucesso:', result.data.id);
      } else if (response.status === 409) {
        // Duplicado - marcar como sincronizado também
        markAsSynced(localRecord.id);
        console.log('⚠️ Registro duplicado - marcado como sincronizado');
      } else {
        console.warn('⚠️ Falha na sincronização:', result.error);
      }
    } catch (error) {
      console.warn('⚠️ Erro na sincronização em background:', error);
      // Não fazer nada - registro já está salvo localmente
    }
  })();
  
  // Retornar imediatamente o registro local (não espera sincronização)
  return localRecord;
}

// Obter último registro de um tipo específico
export async function getLastServiceRecord(
  maintenanceKey: string,
  vehicleId?: string
): Promise<ServiceRecord | null> {
  if (!vehicleId) {
    // Fallback para registros locais se não tiver vehicleId
    const records = getLocalRecords();
    const filtered = records
      .filter(r => r.maintenance_item_key === maintenanceKey)
      .sort((a, b) => b.odometer_at_service - a.odometer_at_service);
    
    return filtered[0] || null;
  }
  
  const lastRecordsByKey = await getLastRecordsByKey(vehicleId);
  return lastRecordsByKey[maintenanceKey] || null;
}

// Obter registros não sincronizados
export function getUnsyncedRecords(): ServiceRecord[] {
  return getLocalRecords().filter(r => !r.synced);
}

// Marcar registro como sincronizado
export function markAsSynced(recordId: string): void {
  if (!isClient) return;
  
  try {
    const records = getLocalRecords();
    const updated = records.map(r => 
      r.id === recordId ? { ...r, synced: true } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Remover dos pendentes também
    const pending = getPendingRecords();
    const updatedPending = pending.filter(r => r.id !== recordId);
    localStorage.setItem(PENDING_KEY, JSON.stringify(updatedPending));
  } catch (error) {
    console.error('Erro ao marcar como sincronizado:', error);
  }
}

// Sincronizar registros locais com Supabase via API
export async function syncLocalRecordsToSupabase(vehicleId: string): Promise<number> {
  const unsyncedRecords = getUnsyncedRecords();
  if (unsyncedRecords.length === 0) {
    return 0;
  }
  
  // Obter sessão válida
  const session = await getValidSession();
  
  if (!session) {
    console.warn('⚠️ Sessão inválida - sincronização adiada');
    return 0;
  }
  
  let syncedCount = 0;
  
  for (const record of unsyncedRecords) {
    try {
      const response = await fetch('/api/service-records/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          maintenance_item_key: record.maintenance_item_key,
          odometer_at_service: record.odometer_at_service,
          service_date: record.service_date,
          interval_used_km: record.interval_used_km,
          cost: record.cost,
          notes: record.notes,
        }),
      });

      if (response.ok) {
        markAsSynced(record.id);
        syncedCount++;
      } else if (response.status === 409) {
        // Se for duplicado, marcar como sincronizado também (já existe no banco)
        console.log('⚠️ Registro já existe no banco - marcando como sincronizado:', record.id);
        markAsSynced(record.id);
        syncedCount++;
      } else {
        const result = await response.json();
        console.error('Erro ao sincronizar registro:', record.id, result.error);
      }
    } catch (error) {
      console.error('Erro ao sincronizar registro:', record.id, error);
    }
  }
  
  console.log(`✅ ${syncedCount} registros sincronizados via API`);
  return syncedCount;
}

// Exportar registros não sincronizados como JSON
export function exportUnsyncedRecords(): void {
  if (!isClient) return;
  
  const unsynced = getUnsyncedRecords();
  
  const dataStr = JSON.stringify(unsynced, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pending_service_records_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Gerar documentação de backend
export function generateBackendDocs(): void {
  if (!isClient) return;
  
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
- Fallback local se API falhar
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
