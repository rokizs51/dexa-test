import { cn } from '../lib/utils';
import type { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-brown-200">
      <table className={cn('w-full text-left', className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return <thead className={cn('bg-brown-50', className)}>{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={cn('bg-white', className)}>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

export function TableRow({ children, className }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-brown-100 last:border-0 hover:bg-brown-50/50 transition-colors',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-xs font-semibold text-brown-800 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={cn('px-6 py-4 text-sm text-brown-900', className)}>
      {children}
    </td>
  );
}

interface TableEmptyProps {
  message?: string;
  colSpan: number;
}

export function TableEmpty({
  message = 'No data available',
  colSpan,
}: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-brown-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-brown-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-brown-600">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default Table;
