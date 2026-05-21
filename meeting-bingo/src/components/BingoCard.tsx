import type { BingoCard as BingoCardT, WinningLine } from '../types';
import { BingoSquare } from './BingoSquare';
import { cn } from '../lib/utils';

interface BingoCardProps {
  card: BingoCardT;
  winningLine: WinningLine | null;
  nearWinSquareIds?: ReadonlySet<string>;
  onSquareClick: (row: number, col: number) => void;
  readOnly?: boolean;
  className?: string;
}

export function BingoCard({
  card,
  winningLine,
  nearWinSquareIds,
  onSquareClick,
  readOnly = false,
  className,
}: BingoCardProps) {
  const winningSet = new Set(winningLine?.squares ?? []);

  return (
    <div
      role="grid"
      aria-label="Bingo card, 5 by 5 grid"
      aria-rowcount={5}
      aria-colcount={5}
      className={cn('grid grid-cols-5 gap-1.5 sm:gap-2', className)}
    >
      {card.squares.flat().map((sq) => (
        <BingoSquare
          key={sq.id}
          square={sq}
          isWinningSquare={winningSet.has(sq.id)}
          isNearWinSquare={nearWinSquareIds?.has(sq.id) ?? false}
          onClick={() => onSquareClick(sq.row, sq.col)}
          disabled={readOnly}
        />
      ))}
    </div>
  );
}
