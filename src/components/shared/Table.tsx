import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="table-wrapper">
      <table className={`table ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead>{children}</thead>;
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
}

export function TableRow({ children, onClick }: TableRowProps) {
  return (
    <tr onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {children}
    </tr>
  );
}

interface TableCellProps {
  children?: ReactNode;
  header?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export function TableCell({ children, header, align = 'left', width }: TableCellProps) {
  const style = { textAlign: align, width };
  
  if (header) {
    return <th style={style}>{children}</th>;
  }
  
  return <td style={style}>{children}</td>;
}

interface TableFooterProps {
  children: ReactNode;
}

export function TableFooter({ children }: TableFooterProps) {
  return <tfoot>{children}</tfoot>;
}
