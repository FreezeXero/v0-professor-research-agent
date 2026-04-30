import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number | null | undefined
  max?: number
  reviewCount?: number | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  showMax?: boolean
  className?: string
}

export function getScoreColor(score: number | null | undefined, max = 5) {
  if (score === null || score === undefined) return 'neutral'
  const normalized = score / max
  if (normalized >= 0.74) return 'green'
  if (normalized >= 0.56) return 'yellow'
  return 'red'
}

export function ScoreBadge({
  score,
  max = 5,
  reviewCount,
  size = 'md',
  label,
  showMax = true,
  className,
}: ScoreBadgeProps) {
  const color = getScoreColor(score, max)

  const colorClasses = {
    green: {
      bg: 'bg-score-green-bg',
      text: 'text-score-green',
      ring: 'ring-score-green/20',
    },
    yellow: {
      bg: 'bg-score-yellow-bg',
      text: 'text-score-yellow',
      ring: 'ring-score-yellow/20',
    },
    red: {
      bg: 'bg-score-red-bg',
      text: 'text-score-red',
      ring: 'ring-score-red/20',
    },
    neutral: {
      bg: 'bg-surface-2',
      text: 'text-muted-foreground',
      ring: 'ring-border',
    },
  }

  const sizeClasses = {
    sm: { container: 'gap-1', score: 'text-lg font-bold', sub: 'text-[10px]', padding: 'px-2.5 py-1.5' },
    md: { container: 'gap-1', score: 'text-2xl font-bold', sub: 'text-xs', padding: 'px-3 py-2' },
    lg: { container: 'gap-1.5', score: 'text-3xl font-bold', sub: 'text-xs', padding: 'px-4 py-3' },
    xl: { container: 'gap-2', score: 'text-5xl font-bold', sub: 'text-sm', padding: 'px-5 py-4' },
  }

  const c = colorClasses[color]
  const s = sizeClasses[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg ring-1',
        c.bg,
        c.ring,
        s.padding,
        className,
      )}
    >
      {label && (
        <span className={cn('text-muted-foreground font-medium uppercase tracking-wider', s.sub)}>
          {label}
        </span>
      )}
      <span className={cn(c.text, s.score, 'leading-none tabular-nums')}>
        {score !== null && score !== undefined ? score.toFixed(1) : '—'}
      </span>
      {showMax && (
        <span className={cn('text-muted-foreground', s.sub)}>
          / {max}
        </span>
      )}
      {reviewCount !== undefined && reviewCount !== null && (
        <span className={cn('text-muted-foreground mt-0.5', s.sub)}>
          {reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'}
        </span>
      )}
    </div>
  )
}

export function ScoreBar({
  score,
  max = 5,
  label,
  reviewCount,
}: {
  score: number | null | undefined
  max?: number
  label: string
  reviewCount?: number | null
}) {
  const color = getScoreColor(score, max)
  const percentage = score !== null && score !== undefined ? (score / max) * 100 : 0

  const barColors = {
    green: 'bg-score-green',
    yellow: 'bg-score-yellow',
    red: 'bg-score-red',
    neutral: 'bg-muted-foreground',
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {reviewCount !== undefined && reviewCount !== null && (
            <span className="text-xs text-muted-foreground/70">{reviewCount.toLocaleString()} reviews</span>
          )}
          <span className={cn('text-xs font-semibold tabular-nums', {
            'text-score-green': color === 'green',
            'text-score-yellow': color === 'yellow',
            'text-score-red': color === 'red',
            'text-muted-foreground': color === 'neutral',
          })}>
            {score !== null && score !== undefined ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
