import type { BingoCard, WinningLine } from '../types';

/** Checks a 5×5 bingo card for any completed row, column, or diagonal. Returns the first winning line found, or null. */
export function checkForBingo(card: BingoCard): WinningLine | null {
  const grid = card.squares;

  for (let r = 0; r < 5; r++) {
    if (grid[r].every((sq) => sq.isFilled)) {
      return {
        type: 'row',
        index: r,
        squares: grid[r].map((sq) => sq.id),
      };
    }
  }

  for (let c = 0; c < 5; c++) {
    if (grid.every((row) => row[c].isFilled)) {
      return {
        type: 'column',
        index: c,
        squares: grid.map((row) => row[c].id),
      };
    }
  }

  if ([0, 1, 2, 3, 4].every((i) => grid[i][i].isFilled)) {
    return {
      type: 'diagonal',
      index: 0,
      squares: [0, 1, 2, 3, 4].map((i) => `${i}-${i}`),
    };
  }
  if ([0, 1, 2, 3, 4].every((i) => grid[i][4 - i].isFilled)) {
    return {
      type: 'diagonal',
      index: 1,
      squares: [0, 1, 2, 3, 4].map((i) => `${i}-${4 - i}`),
    };
  }

  return null;
}

/** Describes a line that is exactly one square away from a bingo. */
export interface NearWinLine {
  type: 'row' | 'column' | 'diagonal';
  index: number;
  missingSquareId: string;
  missingWord: string;
}

/** Returns every line that has exactly 4 of 5 squares filled (near-win state). */
export function getClosestToWin(card: BingoCard): NearWinLine[] {
  const grid = card.squares;
  const result: NearWinLine[] = [];

  const consider = (
    type: NearWinLine['type'],
    index: number,
    coords: ReadonlyArray<readonly [number, number]>,
  ) => {
    const cells = coords.map(([r, c]) => grid[r][c]);
    const filled = cells.filter((sq) => sq.isFilled).length;
    if (filled === 4) {
      const missing = cells.find((sq) => !sq.isFilled)!;
      result.push({
        type,
        index,
        missingSquareId: missing.id,
        missingWord: missing.word,
      });
    }
  };

  for (let r = 0; r < 5; r++) {
    consider(
      'row',
      r,
      [0, 1, 2, 3, 4].map((c) => [r, c] as const),
    );
  }
  for (let c = 0; c < 5; c++) {
    consider(
      'column',
      c,
      [0, 1, 2, 3, 4].map((r) => [r, c] as const),
    );
  }
  consider(
    'diagonal',
    0,
    [0, 1, 2, 3, 4].map((i) => [i, i] as const),
  );
  consider(
    'diagonal',
    1,
    [0, 1, 2, 3, 4].map((i) => [i, 4 - i] as const),
  );

  return result;
}
