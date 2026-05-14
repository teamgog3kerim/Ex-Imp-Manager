export function formatCurrency(amount: number, currency: 'ETB' | 'USD' = 'ETB') {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-ET').format(num);
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
