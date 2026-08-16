export function formatINR(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function monthLabel(month) {
  if (!month) return '—';
  const [y, m] = month.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[m - 1]} ${y}`;
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (24 * 60 * 60 * 1000));
}

export function gradeColor(grade) {
  if (!grade || grade === '—') return 'gray';
  if (['A1', 'A2', 'B1'].includes(grade)) return 'green';
  if (['B2', 'C1'].includes(grade)) return 'sky';
  if (['C2'].includes(grade)) return 'amber';
  return 'red';
}