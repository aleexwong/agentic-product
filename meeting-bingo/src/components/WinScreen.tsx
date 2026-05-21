import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameState } from '../types';
import { Button } from './ui/Button';
import { BingoCard } from './BingoCard';
import { ConfirmDialog } from './GameBoard';
import { buildShareText, shareOrCopy } from '../lib/shareUtils';
import { getCategoryById } from '../data/categories';

interface WinScreenProps {
  game: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function WinScreen({ game, onPlayAgain, onHome }: WinScreenProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'failed'>(
    'idle',
  );
  const [confirmHome, setConfirmHome] = useState(false);

  useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }, []);

  if (!game.card) return null;

  const minutes =
    game.startedAt && game.completedAt
      ? Math.max(1, Math.round((game.completedAt - game.startedAt) / 60000))
      : 0;
  const categoryName = game.category ? getCategoryById(game.category).name : '—';

  async function handleShare() {
    const text = buildShareText(game);
    const status = await shareOrCopy(text);
    setShareStatus(status);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">🎉 BINGO! 🎉</h1>
      <p className="mt-1 text-sm text-gray-600">Nice work — you spotted the buzzwords.</p>

      <div className="mt-5 w-full">
        <BingoCard
          card={game.card}
          winningLine={game.winningLine}
          onSquareClick={() => {}}
          readOnly
        />
      </div>

      <dl className="mt-6 grid w-full grid-cols-2 gap-3 text-left text-sm sm:grid-cols-4">
        <Stat label="Time" value={`${minutes} min`} />
        <Stat label="Winning word" value={`"${game.winningWord ?? '—'}"`} />
        <Stat label="Filled" value={`${game.filledCount}/24`} />
        <Stat label="Category" value={categoryName} />
      </dl>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={handleShare}>
          {shareStatus === 'idle' && 'Share Result'}
          {shareStatus === 'shared' && '✓ Shared'}
          {shareStatus === 'copied' && '✓ Copied to clipboard'}
          {shareStatus === 'failed' && 'Copy failed — try again'}
        </Button>
        <Button variant="secondary" onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button variant="ghost" onClick={() => setConfirmHome(true)}>
          Home
        </Button>
      </div>

      {confirmHome && (
        <ConfirmDialog
          title="Start over?"
          body="Your current game will be lost."
          confirmLabel="Go home"
          onConfirm={() => {
            setConfirmHome(false);
            onHome();
          }}
          onCancel={() => setConfirmHome(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
