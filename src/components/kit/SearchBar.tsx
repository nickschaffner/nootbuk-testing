import { Search } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// SearchBar — leading icon box (panel fill) flush against the field.
// One hairline frame. No gap.
// ─────────────────────────────────────────────────────────────────────────

export type SearchBarProps = InputHTMLAttributes<HTMLInputElement>

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ className, type = 'search', ...rest }, ref) {
    return (
      <div
        className={cn(
          'flex h-9 w-full overflow-hidden rounded-xs border border-hairline bg-card hover:border-foreground/60 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
          className,
        )}
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center border-r border-hairline bg-panel text-muted-foreground"
        >
          <Search size={15} strokeWidth={2} />
        </span>
        <input
          ref={ref}
          type={type}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-40 [&::-webkit-search-cancel-button]:hidden"
          {...rest}
        />
      </div>
    )
  },
)
