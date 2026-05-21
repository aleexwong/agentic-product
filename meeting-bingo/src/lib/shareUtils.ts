import type { GameState } from '../types';
import { getCategoryById } from '../data/categories';

/** Formats a shareable result string from a completed game, including category, winning word, and fill count. */
export function buildShareText(game: GameState): string {
  const minutes =
    game.startedAt && game.completedAt
      ? Math.max(1, Math.round((game.completedAt - game.startedAt) / 60000))
      : 0;
  const categoryName = game.category ? getCategoryById(game.category).name : 'Mixed';
  const winningWord = game.winningWord ?? '—';
  const playUrl =
    typeof window !== 'undefined' && window.location?.href
      ? window.location.href
      : 'https://meeting-bingo.vercel.app';

  return [
    `🎯 BINGO! I won Meeting Bingo in ${minutes} minute${minutes === 1 ? '' : 's'}!`,
    `Category: ${categoryName} | Winning word: "${winningWord}"`,
    `Squares filled: ${game.filledCount}/24`,
    '',
    `Play at: ${playUrl}`,
  ].join('\n');
}

/** Copies text to the system clipboard via the Clipboard API. Returns true on success. */
export async function copyShareText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}

/** Tries native Web Share API first; falls back to clipboard copy. Returns the outcome. */
export async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // user cancelled or share unsupported — fall through to copy
    }
  }
  return (await copyShareText(text)) ? 'copied' : 'failed';
}
