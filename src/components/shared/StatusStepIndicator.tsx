import { cn } from '@/lib/utils'

interface StatusStepIndicatorProps<T extends string> {
  stages: readonly T[]
  value: T
  onChange: (value: T) => void
  formatLabel?: (stage: T) => string
  className?: string
}

export function StatusStepIndicator<T extends string>({
  stages,
  value,
  onChange,
  formatLabel = (stage) => stage.replace(/-/g, ' '),
  className,
}: StatusStepIndicatorProps<T>) {
  const currentIndex = Math.max(0, stages.indexOf(value))

  return (
    <div
      role="group"
      aria-label="Status"
      className={cn('flex w-full min-w-0 items-center gap-0', className)}
    >
      {stages.map((stage, index) => {
        const isReached = index <= currentIndex
        const isCurrent = index === currentIndex

        return (
          <button
            key={stage}
            type="button"
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={formatLabel(stage)}
            title={formatLabel(stage)}
            onClick={() => onChange(stage)}
            className={cn(
              'relative flex min-w-0 flex-1 flex-col items-center gap-1.5 px-0.5 py-1 text-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span
              className={cn(
                'relative z-10 size-2.5 shrink-0 rounded-full border-2 transition-colors',
                isReached
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/40 bg-background',
              )}
            />
            {index < stages.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute top-[0.6875rem] left-1/2 h-0.5 w-full -translate-y-1/2',
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/25',
                )}
              />
            ) : null}
            <span
              className={cn(
                'w-full truncate text-[10px] leading-tight capitalize sm:text-xs',
                isReached
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {formatLabel(stage)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
