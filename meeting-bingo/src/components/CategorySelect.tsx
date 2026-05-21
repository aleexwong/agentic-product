import { useMemo, useState } from 'react';
import type { BingoCard as BingoCardT, CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { BingoCard } from './BingoCard';
import { cn } from '../lib/utils';

interface CategorySelectProps {
  initialCategory: CategoryId | null;
  card: BingoCardT | null;
  onSelectCategory: (id: CategoryId) => void;
  onRegenerate: () => void;
  onStart: () => void;
  onBack: () => void;
}

export function CategorySelect({
  initialCategory,
  card,
  onSelectCategory,
  onRegenerate,
  onStart,
  onBack,
}: CategorySelectProps) {
  const [step, setStep] = useState<'pick' | 'preview'>(
    initialCategory && card ? 'preview' : 'pick',
  );

  const selectedCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === initialCategory),
    [initialCategory],
  );

  function handlePick(id: CategoryId) {
    onSelectCategory(id);
    setStep('preview');
  }

  if (step === 'preview' && card && selectedCategory) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-6 py-10">
        <button
          type="button"
          onClick={onBack}
          className="self-start text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <div className="mt-2 text-center">
          <div className="text-3xl" aria-hidden="true">
            {selectedCategory.icon}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {selectedCategory.name}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Preview your card. Regenerate or start when ready.
          </p>
        </div>

        <div className="mt-6 w-full max-w-md">
          <BingoCard
            card={card}
            winningLine={null}
            onSquareClick={() => {}}
            readOnly
          />
        </div>

        <div className="mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onRegenerate}>
            🔄 Regenerate
          </Button>
          <Button size="lg" className="flex-1" onClick={onStart}>
            Start Game
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 py-10">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back
      </button>
      <h1 className="mt-2 text-3xl font-semibold text-gray-900">Pick a category</h1>
      <p className="mt-1 text-sm text-gray-600">Each pack has 40+ buzzwords.</p>

      <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Card
            key={cat.id}
            interactive
            className={cn('flex flex-col text-left')}
            onClick={() => handlePick(cat.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePick(cat.id);
              }
            }}
            role="button"
            aria-label={`Pick ${cat.name}`}
          >
            <div className="text-3xl" aria-hidden="true">
              {cat.icon}
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{cat.name}</div>
            <div className="mt-1 text-sm text-gray-600">{cat.description}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {cat.words.slice(0, 4).map((w) => (
                <span
                  key={w}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                >
                  {w}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
