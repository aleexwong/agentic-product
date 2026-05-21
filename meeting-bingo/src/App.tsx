import { useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { GameBoard } from './components/GameBoard';
import { WinScreen } from './components/WinScreen';
import { useGame } from './hooks/useGame';
import type { GameState } from './types';

const STORAGE_KEY = 'meeting-bingo-state';

function loadInitialState(): GameState | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed && parsed.status === 'playing' && parsed.card) {
      return { ...parsed, isListening: false };
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function App() {
  const initial = useRef(loadInitialState()).current;
  const api = useGame(initial);
  const {
    game,
    goToCategorySelect,
    selectCategory,
    regenerateCard,
    startGame,
    resetGame,
    backToLanding,
  } = api;

  // Auto-save game state to localStorage on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      /* quota / privacy mode */
    }
  }, [game]);

  if (game.status === 'idle') {
    return <LandingPage onStart={goToCategorySelect} />;
  }

  if (game.status === 'setup') {
    return (
      <CategorySelect
        initialCategory={game.category}
        card={game.card}
        onSelectCategory={selectCategory}
        onRegenerate={regenerateCard}
        onStart={startGame}
        onBack={backToLanding}
      />
    );
  }

  if (game.status === 'playing') {
    return <GameBoard api={api} onResetGame={resetGame} />;
  }

  // 'won'
  return (
    <WinScreen
      game={game}
      onPlayAgain={() => {
        if (game.category) selectCategory(game.category);
      }}
      onHome={resetGame}
    />
  );
}

export default App;
