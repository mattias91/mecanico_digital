import { Alerta, Veiculo, IntervaloManutencao, TipoManutencao } from './types';
import { getLastRecordsByKey } from './serviceRecordsStorage';

/**
 * Calcula os alertas de manutenção baseado nos registros de serviço (Supabase + local)
 */
export async function calcularAlertas(
  veiculo: Veiculo,
  intervalos: IntervaloManutencao
): Promise<Alerta[]> {
  const tiposManutencao: TipoManutencao[] = [
    'oleo',
    'pastilha',
    'filtro',
    'pneu',
    'revisao',
    'arrefecimento',
    'correia_dentada',
    'corrente_comando',
  ];

  const alertas: Alerta[] = [];

  // Buscar últimos registros por maintenance_item_key
  const lastRecordsByKey = await getLastRecordsByKey(veiculo.id);

  tiposManutencao.forEach((tipo) => {
    // Mapear tipo para maintenance_item_key
    const maintenanceKey = mapTipoToKey(tipo);
    const lastRecord = lastRecordsByKey[maintenanceKey];

    if (!lastRecord) {
      // Sem registro - criar alerta informativo
      alertas.push({
        id: `alerta_${tipo}_${Date.now()}`,
        id_veiculo: veiculo.id,
        tipo_manutencao: tipo,
        km_limite: 0,
        km_ultimo: 0,
        status: 'ok',
        remaining_km: 0,
        sem_registro: true,
      });
      return;
    }

    // Calcular próxima manutenção baseado no último registro
    const intervaloUsado = lastRecord.interval_used_km || intervalos[tipo];
    const nextDueKm = lastRecord.odometer_at_service + intervaloUsado;
    const remainingKm = nextDueKm - veiculo.km_atual;

    // Determinar status
    let status: 'ok' | 'proximo' | 'atrasado';
    if (remainingKm <= 0) {
      status = 'atrasado';
    } else if (remainingKm <= intervaloUsado * 0.1) {
      // Próximo se faltam menos de 10% do intervalo
      status = 'proximo';
    } else {
      status = 'ok';
    }

    alertas.push({
      id: `alerta_${tipo}_${Date.now()}`,
      id_veiculo: veiculo.id,
      tipo_manutencao: tipo,
      km_limite: nextDueKm,
      km_ultimo: lastRecord.odometer_at_service,
      status,
      remaining_km: remainingKm,
      sem_registro: false,
    });
  });

  return alertas;
}

/**
 * Mapeia TipoManutencao para maintenance_item_key
 */
function mapTipoToKey(tipo: TipoManutencao): string {
  const mapping: Record<TipoManutencao, string> = {
    'oleo': 'oil',
    'pastilha': 'brake_pad',
    'filtro': 'filter',
    'pneu': 'tire',
    'revisao': 'inspection',
    'arrefecimento': 'coolant',
    'correia_dentada': 'timing_belt',
    'corrente_comando': 'timing_chain',
  };
  
  return mapping[tipo] || tipo;
}

/**
 * Formata número com separador de milhares
 */
export function formatarNumero(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Calcula porcentagem de uso do intervalo
 */
export function calcularPorcentagemUso(
  kmAtual: number,
  kmUltimo: number,
  intervalo: number
): number {
  const kmPercorridos = kmAtual - kmUltimo;
  return Math.min(100, Math.max(0, (kmPercorridos / intervalo) * 100));
}
