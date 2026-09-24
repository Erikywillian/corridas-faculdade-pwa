export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthKey(date = new Date()) {
  return toDateKey(date).slice(0, 7);
}

export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function weekdayOf(key) {
  return parseDateKey(key).getDay();
}

export function datesInMonth(month) {
  const [year, number] = month.split('-').map(Number);
  const count = new Date(year, number, 0, 12).getDate();
  return Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
}

export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(year, number - 1 + delta, 1, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const formatDate = key => new Intl.DateTimeFormat('pt-BR').format(parseDateKey(key));
export const formatMonth = month => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(parseDateKey(`${month}-01`));
