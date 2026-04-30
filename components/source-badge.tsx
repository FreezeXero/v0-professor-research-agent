import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface SourceBadgeProps {
  type: 'rmp' | 'reddit' | 'other'
  name: string
  reviewCount: number
  url?: string | null
}

const sourceConfig = {
  rmp: {
    bg: 'bg-[oklch(0.18_0.04_25)]',
    border: 'border-[oklch(0.3_0.06_25)]',
    text: 'text-[oklch(0.75_0.18_25)]',
    dot: 'bg-[oklch(0.68_0.2_25)]',
    label: 'Rate My Professor',
    abbr: 'RMP',
  },
  reddit: {
    bg: 'bg-[oklch(0.17_0.04_35)]',
    border: 'border-[oklch(0.28_0.06_35)]',
    text: 'text-[oklch(0.72_0.16_35)]',
    dot: 'bg-[oklch(0.65_0.2_35)]',
    label: 'Reddit',
    abbr: 'Reddit',
  },
  other: {
    bg: 'bg-surface-2',
    border: 'border-border',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    label: 'Other',
    abbr: 'Other',
  },
}

export function SourceBadge({ type, name, reviewCount, url }: SourceBadgeProps) {
  const config = sourceConfig[type] || sourceConfig.other

  const inner = (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium',
        'transition-colors duration-150',
        config.bg,
        config.border,
        config.text,
        url && 'cursor-pointer hover:opacity-80',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <span>{name || config.label}</span>
      <span className="text-muted-foreground font-normal">
        {reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'}
      </span>
      {url && <ExternalLink size={11} className="opacity-60" />}
    </div>
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }

  return inner
}
