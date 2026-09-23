export function formatDate(value, fallback = '-') {
  if (!value) return fallback;
  const rawValue = String(value).trim();
  if (!rawValue) return fallback;
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);
  if (Number.isNaN(dateValue.getTime())) return fallback;
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(dateValue);
}

export function formatDateInput(value) {
  if (!value) return '';
  const rawValue = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? rawValue : rawValue.slice(0, 10);
}