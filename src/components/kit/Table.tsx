import {
  createContext,
  useContext,
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Table — agnostic hairline data grid. Any TableHead with a text label is
// sortable. Empty / non-text heads (actions, icons) are not.
// Sorting is controlled: the table does not touch your data.
// ─────────────────────────────────────────────────────────────────────────

export type TableSortDirection = 'asc' | 'desc'

export interface TableSort {
  column: string
  direction: TableSortDirection
}

interface TableSortContextValue {
  sort: TableSort | null
  onSort?: (sort: TableSort) => void
}

const TableSortContext = createContext<TableSortContextValue>({ sort: null })

function headerColumnId(children: ReactNode, column?: string): string | null {
  if (column?.trim()) {
    return column.trim()
  }
  if (typeof children === 'string' && children.trim()) {
    return children.trim()
  }
  if (typeof children === 'number') {
    return String(children)
  }
  return null
}

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  sort?: TableSort | null
  onSort?: (sort: TableSort) => void
}

export function Table({
  children,
  className,
  sort = null,
  onSort,
  ...rest
}: TableProps) {
  return (
    <TableSortContext.Provider value={{ sort, onSort }}>
      <div className={cn('w-full min-w-0 overflow-x-auto', className)}>
        <table className="w-full border-collapse text-sm" {...rest}>
          {children}
        </table>
      </div>
    </TableSortContext.Provider>
  )
}

export function TableHeader({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'border-b border-hairline [&_tr]:cursor-default [&_tr]:hover:bg-transparent',
        className,
      )}
      {...rest}
    >
      {children}
    </thead>
  )
}

export function TableBody({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  )
}

export function TableRow({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-hairline last:border-b-0 hover:bg-muted/50',
        rest.onClick && 'cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  )
}

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Sort id. Defaults to the header text. */
  column?: string
}

export function TableHead({
  children,
  className,
  column,
  ...rest
}: TableHeadProps) {
  const { sort, onSort } = useContext(TableSortContext)
  const columnId = headerColumnId(children, column)
  const sortable = Boolean(onSort && columnId)
  const active = sortable && sort?.column === columnId
  const direction = active ? sort.direction : undefined

  function handleSort() {
    if (!onSort || !columnId) {
      return
    }
    if (sort?.column === columnId) {
      onSort({
        column: columnId,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      })
      return
    }
    onSort({ column: columnId, direction: 'asc' })
  }

  return (
    <th
      aria-sort={
        sortable
          ? direction === 'asc'
            ? 'ascending'
            : direction === 'desc'
              ? 'descending'
              : 'none'
          : undefined
      }
      className={cn(
        'label-mono px-3 py-2 text-left font-normal text-muted-foreground',
        className,
      )}
      {...rest}
    >
      {sortable ? (
        <button
          type="button"
          className="focusable inline-flex items-center gap-1 text-left hover:text-foreground"
          onClick={handleSort}
        >
          {children}
          {direction === 'asc' ? (
            <ChevronUp size={12} strokeWidth={2} className="shrink-0 text-foreground" />
          ) : direction === 'desc' ? (
            <ChevronDown size={12} strokeWidth={2} className="shrink-0 text-foreground" />
          ) : (
            <ChevronsUpDown size={12} strokeWidth={2} className="shrink-0 opacity-40" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  )
}

export function TableCell({
  children,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-3 py-2 align-middle', className)} {...rest}>
      {children}
    </td>
  )
}

export function TableActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  )
}
