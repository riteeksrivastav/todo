export function dateLabel(iso: string, today: string): string {
  if (iso === today) return 'Today';
  const t = parseISO(today);
  const d = parseISO(iso);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fullDateLabel(iso: string): string {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}
