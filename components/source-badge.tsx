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
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/80',
    dot: 'bg-score-green',
    label: 'Rate My Professor',
    abbr: 'RMP',
  },
  reddit: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/80',
    dot: 'bg-[#FF4500]',
    label: 'Reddit',
    abbr: 'Reddit',
  },
  other: {
    bg: 'bg-surface-2',
    border: 'border-border/30',
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
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium',
        'transition-all duration-200',
        config.bg,
        config.border,
        config.text,
        url && 'cursor-pointer hover:bg-white/10',
      )}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} />
      <span>{name || config.label}</span>
      <span className="text-muted-foreground/50 font-normal tabular-nums">
        {reviewCount.toLocaleString()}
      </span>
      {url && <ExternalLink size={11} className="opacity-50" />}
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
