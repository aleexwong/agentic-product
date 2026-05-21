import type { BingoSquare as BingoSquareT } from '../types';
import { cn } from '../lib/utils';

interface BingoSquareProps {
  square: BingoSquareT;
  isWinningSquare: boolean;
  isNearWinSquare?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function BingoSquare({
  square,
  isWinningSquare,
  isNearWinSquare = false,
  onClick,
  disabled = false,
}: BingoSquareProps) {
  const { word, isFilled, isAutoFilled, isFreeSpace } = square;

  const ariaLabel = isFreeSpace
    ? 'Free space, filled'
    : `${word}, ${isFilled ? 'filled' : 'not filled'}`;

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={ariaLabel}
      aria-pressed={isFilled}
      onClick={onClick}
      disabled={disabled || isFreeSpace}
      className={cn(
        'relative aspect-square w-full select-none rounded-lg border-2 px-1 py-2 text-center text-xs font-medium leading-tight transition sm:text-sm',
        'flex items-center justify-center',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
        !isFreeSpace && !isFilled && 'hover:scale-[1.03] active:scale-95',
        !isFilled && !isFreeSpace && 'bg-white border-gray-200 text-gray-700 hover:border-blue-300',
        isFilled && !isFreeSpace && 'bg-blue-500 border-blue-600 text-white line-through',
        isAutoFilled && 'animate-bounce-in',
        isFreeSpace && 'bg-amber-100 border-amber-300 text-amber-900 cursor-default',
        isWinningSquare && 'bg-green-500 border-green-600 text-white ring-2 ring-green-300 ring-offset-1',
        isNearWinSquare && !isFilled && 'border-yellow-400 animate-pulse-fast bg-yellow-50',
      )}
    >
      {isFreeSpace ? (
        <span className="flex flex-col items-center gap-0.5">
          <span aria-hidden="true" className="text-base">⭐</span>
          <span className="text-[10px] uppercase tracking-wide sm:text-xs">Free</span>
        </span>
      ) : (
        <span className="break-words">{word}</span>
      )}
    </button>
  );
}
