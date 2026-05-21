import type { BingoCard, BingoSquare, CategoryId } from '../types';
import { getCategoryById } from '../data/categories';

function shuffle<T>(array: readonly T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateCard(categoryId: CategoryId): BingoCard {
  const category = getCategoryById(categoryId);
  const picked = shuffle(category.words).slice(0, 24);

  const squares: BingoSquare[][] = [];
  let pickIndex = 0;
  const now = Date.now();

  for (let row = 0; row < 5; row++) {
    const rowSquares: BingoSquare[] = [];
    for (let col = 0; col < 5; col++) {
      const isFreeSpace = row === 2 && col === 2;
      rowSquares.push({
        id: `${row}-${col}`,
        word: isFreeSpace ? 'FREE' : picked[pickIndex++],
        isFilled: isFreeSpace,
        isAutoFilled: false,
        isFreeSpace,
        filledAt: isFreeSpace ? now : null,
        row,
        col,
      });
    }
    squares.push(rowSquares);
  }

  const words = squares.flat().map((sq) => sq.word);
  return { squares, words };
}
