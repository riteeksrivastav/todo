import type { SortMode } from '../types';

interface Props {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}

export function SortToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center bg-zinc-100 rounded-full p-1 text-xs">
      <button
        type="button"
        onClick={() => onChange('created')}
        className={
          'px-3 h-7 rounded-full transition ' +
          (value === 'created' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')
        }
      >
        By date added
      </button>
      <button
        type="button"
        onClick={() => onChange('priority')}
        className={
          'px-3 h-7 rounded-full transition ' +
          (value === 'priority' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')
        }
      >
        By priority
      </button>
    </div>
  );
}
