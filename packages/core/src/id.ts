const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export function shortId(date: string): string {
  const compact = date.slice(2).replace(/-/g, '');
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    suffix += ALPHABET[idx];
  }
  return `${compact}-${suffix}`;
}

export function uniqueId(date: string, taken: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const id = shortId(date);
    if (!taken.has(id)) return id;
  }
  throw new Error('failed to generate unique id');
}
