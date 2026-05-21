import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ className, children, interactive = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        interactive &&
          'cursor-pointer transition hover:border-blue-300 hover:shadow-md focus-within:border-blue-400',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
