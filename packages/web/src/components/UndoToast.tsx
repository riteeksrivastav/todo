import { useEffect } from 'react';

interface Props {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export function UndoToast({ message, onUndo, onDismiss, durationMs = 5000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-900 text-white shadow-lg text-sm">
        <span>{message}</span>
        <button
          type="button"
          onClick={onUndo}
          className="font-medium text-rose-300 hover:text-rose-200"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
