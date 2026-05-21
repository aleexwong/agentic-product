import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UseGameApi } from '../hooks/useGame';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useToasts } from './ui/Toast';
import { ToastContainer } from './ui/Toast';
import { BingoCard } from './BingoCard';
import { TranscriptPanel } from './TranscriptPanel';
import { Button } from './ui/Button';
import { detectWordsWithAliases } from '../lib/wordDetector';
import { getClosestToWin } from '../lib/bingoChecker';
import { cn } from '../lib/utils';

interface GameBoardProps {
  api: UseGameApi;
  onResetGame: () => void;
}

export function GameBoard({ api, onResetGame }: GameBoardProps) {
  const { game, handleSquareClick, fillSquareByWord, regenerateCard, setListening, alreadyFilledWords } =
    api;
  const card = game.card;

  const speech = useSpeechRecognition();
  const { toasts, push, dismiss } = useToasts();
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [confirmNewCard, setConfirmNewCard] = useState(false);

  // Keep refs to avoid stale closures inside the speech onResult callback.
  const alreadyFilledRef = useRef(alreadyFilledWords);
  alreadyFilledRef.current = alreadyFilledWords;
  const cardWordsRef = useRef(card?.words ?? []);
  cardWordsRef.current = card?.words ?? [];
  const fillByWordRef = useRef(fillSquareByWord);
  fillByWordRef.current = fillSquareByWord;
  const pushRef = useRef(push);
  pushRef.current = push;

  const handleSpeechResult = useCallback((finalTranscript: string) => {
    const detected = detectWordsWithAliases(
      finalTranscript,
      cardWordsRef.current,
      alreadyFilledRef.current,
    );
    if (detected.length === 0) return;
    const newlyFilled: string[] = [];
    for (const word of detected) {
      const { filledSquare } = fillByWordRef.current(word, true);
      if (filledSquare) newlyFilled.push(filledSquare.word);
    }
    if (newlyFilled.length > 0) {
      setDetectedWords((prev) => [...prev, ...newlyFilled].slice(-20));
      const msg =
        newlyFilled.length === 1
          ? `🎉 "${newlyFilled[0]}" detected!`
          : `🎉 ${newlyFilled.map((w) => `"${w}"`).join(', ')} detected!`;
      pushRef.current(msg, 'success');
    }
  }, []);

  const handleToggleListening = useCallback(() => {
    if (!speech.isSupported) return;
    if (speech.isListening) {
      speech.stopListening();
      setListening(false);
    } else {
      speech.startListening(handleSpeechResult);
      setListening(true);
    }
  }, [speech, setListening, handleSpeechResult]);

  // Cleanup: stop listening when leaving the board.
  // Use the stable stopListening ref (useCallback with [] deps) so this effect
  // only runs on unmount — not on every render triggered by transcript updates.
  const { stopListening } = speech;
  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  const nearWinSet = useMemo(() => {
    if (!card) return new Set<string>();
    return new Set(getClosestToWin(card).map((line) => line.missingSquareId));
  }, [card]);
  const hasNearWin = nearWinSet.size > 0;

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        No card yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span aria-hidden="true">🎯</span> Meeting Bingo
        </div>
        <div className="flex items-center gap-3">
          <ListeningChip
            isListening={speech.isListening}
            isSupported={speech.isSupported}
          />
          <span className="text-sm font-medium text-gray-600">
            {game.filledCount}/24 filled
          </span>
        </div>
      </header>

      {!speech.isSupported && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tap squares manually — speech recognition isn't available in this browser.
        </div>
      )}

      {speech.error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Mic error: {speech.error}. Tap squares manually or retry.
        </div>
      )}

      {hasNearWin && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-900">
          <span aria-hidden="true">⚡</span> One away!
        </div>
      )}

      <main className="mt-4">
        <BingoCard
          card={card}
          winningLine={game.winningLine}
          nearWinSquareIds={nearWinSet}
          onSquareClick={handleSquareClick}
        />
      </main>

      <div className="mt-4">
        <TranscriptPanel
          transcript={speech.transcript}
          interimTranscript={speech.interimTranscript}
          detectedWords={detectedWords}
          isListening={speech.isListening}
        />
      </div>

      <footer className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={() => setConfirmNewCard(true)}>
          🔄 New Card
        </Button>
        {speech.isSupported && (
          <Button
            variant={speech.isListening ? 'danger' : 'primary'}
            onClick={handleToggleListening}
            className={cn('min-w-[180px]')}
          >
            {speech.isListening ? '⏹ Stop Listening' : '🎤 Start Listening'}
          </Button>
        )}
        <Button variant="ghost" onClick={onResetGame}>
          Home
        </Button>
      </footer>

      {confirmNewCard && (
        <ConfirmDialog
          title="Start a new card?"
          body="Your current progress will be lost."
          confirmLabel="New card"
          onConfirm={() => {
            setConfirmNewCard(false);
            setDetectedWords([]);
            regenerateCard();
          }}
          onCancel={() => setConfirmNewCard(false)}
        />
      )}
    </div>
  );
}

function ListeningChip({
  isListening,
  isSupported,
}: {
  isListening: boolean;
  isSupported: boolean;
}) {
  if (!isSupported) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        <span className="h-2 w-2 rounded-full bg-gray-300" />
        Manual mode
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300',
        )}
      />
      {isListening ? 'Listening' : 'Paused'}
    </span>
  );
}

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dlg-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 id="dlg-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
