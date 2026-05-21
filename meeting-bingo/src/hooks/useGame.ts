import { useCallback, useMemo, useState } from 'react';
import type { BingoCard, BingoSquare, CategoryId, GameState } from '../types';
import { generateCard } from '../lib/cardGenerator';
import { checkForBingo } from '../lib/bingoChecker';

const INITIAL_STATE: GameState = {
  status: 'idle',
  category: null,
  card: null,
  isListening: false,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
  filledCount: 0,
};

function countFilledNonFree(card: BingoCard): number {
  let count = 0;
  for (const row of card.squares) {
    for (const sq of row) {
      if (sq.isFilled && !sq.isFreeSpace) count++;
    }
  }
  return count;
}

function cloneCard(card: BingoCard): BingoCard {
  return {
    squares: card.squares.map((row) => row.map((sq) => ({ ...sq }))),
    words: [...card.words],
  };
}

/** Public API surface returned by useGame. */
export interface UseGameApi {
  game: GameState;
  loadGameState(state: GameState): void;
  goToCategorySelect(): void;
  selectCategory(categoryId: CategoryId): void;
  regenerateCard(): void;
  startGame(): void;
  resetGame(): void;
  backToLanding(): void;
  handleSquareClick(row: number, col: number): void;
  fillSquareByWord(word: string, isAuto: boolean): { filledSquare: BingoSquare | null };
  setListening(isListening: boolean): void;
  alreadyFilledWords: ReadonlySet<string>;
}

/** Core game state manager. Handles card generation, square filling, bingo detection, and win state. */
export function useGame(initial: GameState = INITIAL_STATE): UseGameApi {
  const [game, setGame] = useState<GameState>(initial);

  const loadGameState = useCallback((state: GameState) => {
    setGame(state);
  }, []);

  const goToCategorySelect = useCallback(() => {
    setGame({ ...INITIAL_STATE, status: 'setup' });
  }, []);

  const selectCategory = useCallback((categoryId: CategoryId) => {
    const card = generateCard(categoryId);
    setGame({
      ...INITIAL_STATE,
      status: 'setup',
      category: categoryId,
      card,
    });
  }, []);

  const regenerateCard = useCallback(() => {
    setGame((prev) => {
      if (!prev.category) return prev;
      return { ...prev, card: generateCard(prev.category) };
    });
  }, []);

  const startGame = useCallback(() => {
    setGame((prev) => {
      if (!prev.card) return prev;
      return {
        ...prev,
        status: 'playing',
        startedAt: Date.now(),
        filledCount: countFilledNonFree(prev.card),
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGame(INITIAL_STATE);
  }, []);

  const backToLanding = useCallback(() => {
    setGame(INITIAL_STATE);
  }, []);

  const applyFill = useCallback(
    (
      mutator: (card: BingoCard) => { changed: boolean; touchedSquare: BingoSquare | null },
    ): BingoSquare | null => {
      let touched: BingoSquare | null = null;
      setGame((prev) => {
        if (!prev.card || prev.status !== 'playing') return prev;
        const next = cloneCard(prev.card);
        const result = mutator(next);
        if (!result.changed) return prev;
        touched = result.touchedSquare;
        const win = checkForBingo(next);
        const filledCount = countFilledNonFree(next);
        if (win) {
          const winningSquare = next.squares
            .flat()
            .find((sq) => sq.id === win.squares[win.squares.length - 1]);
          return {
            ...prev,
            card: next,
            filledCount,
            winningLine: win,
            winningWord: winningSquare?.word ?? null,
            status: 'won',
            completedAt: Date.now(),
            isListening: false,
          };
        }
        return { ...prev, card: next, filledCount };
      });
      return touched;
    },
    [],
  );

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      applyFill((card) => {
        const sq = card.squares[row][col];
        if (sq.isFreeSpace) return { changed: false, touchedSquare: null };
        sq.isFilled = !sq.isFilled;
        sq.isAutoFilled = false;
        sq.filledAt = sq.isFilled ? Date.now() : null;
        return { changed: true, touchedSquare: sq };
      });
    },
    [applyFill],
  );

  const fillSquareByWord = useCallback(
    (word: string, isAuto: boolean) => {
      const filledSquare = applyFill((card) => {
        const target = card.squares
          .flat()
          .find(
            (sq) =>
              !sq.isFilled &&
              !sq.isFreeSpace &&
              sq.word.toLowerCase() === word.toLowerCase(),
          );
        if (!target) return { changed: false, touchedSquare: null };
        target.isFilled = true;
        target.isAutoFilled = isAuto;
        target.filledAt = Date.now();
        return { changed: true, touchedSquare: target };
      });
      return { filledSquare };
    },
    [applyFill],
  );

  const setListening = useCallback((isListening: boolean) => {
    setGame((prev) => ({ ...prev, isListening }));
  }, []);

  const alreadyFilledWords = useMemo(() => {
    const set = new Set<string>();
    if (!game.card) return set;
    for (const row of game.card.squares) {
      for (const sq of row) {
        if (sq.isFilled) set.add(sq.word.toLowerCase());
      }
    }
    return set;
  }, [game.card]);

  return {
    game,
    loadGameState,
    goToCategorySelect,
    selectCategory,
    regenerateCard,
    startGame,
    resetGame,
    backToLanding,
    handleSquareClick,
    fillSquareByWord,
    setListening,
    alreadyFilledWords,
  };
}
