import { AlertStatus, MaintenanceType } from './types';

/**
 * Calcula o status de um alerta baseado na quilometragem atual
 */
export function calculateAlertStatus(
  kmAtual: number,
  kmUltimo: number,
  intervalo: number
): AlertStatus {
  const kmLimite = kmUltimo + intervalo;
  const percentual = (kmAtual / kmLimite) * 100;

  if (percentual < 90) return 'ok';
  if (percentual >= 90 && percentual <= 100) return 'proximo';
  return 'atrasado';
}

/**
 * Retorna a cor do status
 */
export function getStatusColor(status: AlertStatus): string {
  switch (status) {
    case 'ok':
      return '#3CCF4E'; // Verde
    case 'proximo':
      return '#FFCC00'; // Amarelo
    case 'atrasado':
      return '#FF3B30'; // Vermelho
  }
}

/**
 * Retorna o texto do status
 */
export function getStatusText(status: AlertStatus): string {
  switch (status) {
    case 'ok':
      return 'Em dia';
    case 'proximo':
      return 'Próximo do prazo';
    case 'atrasado':
      return 'Atrasado';
  }
}

/**
 * Calcula quantos km faltam para a próxima manutenção
 */
export function calculateRemainingKm(
  kmAtual: number,
  kmUltimo: number,
  intervalo: number
): number {
  const kmLimite = kmUltimo + intervalo;
  return Math.max(0, kmLimite - kmAtual);
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Formata quilometragem
 */
export function formatKm(km: number): string {
  return new Intl.NumberFormat('pt-BR').format(km) + ' km';
}
