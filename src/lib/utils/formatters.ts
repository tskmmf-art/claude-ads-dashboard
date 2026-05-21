export function formatCurrency(value: number, currency = 'DKK'): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
