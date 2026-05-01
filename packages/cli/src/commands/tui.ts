import { startTUI } from '@todo/tui';

export async function tuiCommand(): Promise<void> {
  await startTUI();
}
