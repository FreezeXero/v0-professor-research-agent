'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/source-badge'
import type { ResearchResult } from '@/app/api/research/route'
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  MessageSquareQuote,
  Minus,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus as TrendStable,
  XCircle,
  Users,
} from 'lucide-react'

interface ResultsDashboardProps {
  result: ResearchResult
  searchQuery: {
    university: string
    professor: string
    classQuery: string
  }
}

// Score color helper
function getScoreColor(score: number | null | undefined): 'green' | 'yellow' | 'red' | 'neutral' {
  if (score === null || score === undefined) return 'neutral'
  if (score >= 4.0) return 'green'
  if (score >= 3.0) return 'yellow'
  return 'red'
}

// Grade bar component
function GradeBar({ grade, percentage, color }: { grade: string; percentage: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 text-xs font-medium text-white/80">{grade}</span>
      <div className="flex-1 h-3 bg-surface-2 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-10 text-xs text-muted-foreground text-right tabular-nums">{percentage}%</span>
    </div>
  )
}

export function ResultsDashboard({ result, searchQuery }: ResultsDashboardProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}?u=${encodeURIComponent(searchQuery.university)}&p=${encodeURIComponent(searchQuery.professor)}&c=${encodeURIComponent(searchQuery.classQuery)}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [searchQuery])

  // No reviews / not found state
  if (!result.professorFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border/50 flex items-center justify-center">
          <XCircle size={26} className="text-muted-foreground/60" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Professor Not Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {result.notFoundReason ||
              `We couldn't find ${searchQuery.professor} at ${searchQuery.university} in our research data.`}
          </p>
        </div>
        
        {/* Be first to rate CTA */}
        <a
          href="https://www.ratemyprofessors.com/add/professor"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl',
            'bg-white text-black font-medium text-sm',
            'hover:bg-white/90 transition-all duration-200',
            'glow-strong',
          )}
        >
          <Plus size={16} />
          Be the First to Rate
          <ExternalLink size={14} />
        </a>
        
        <p className="text-xs text-muted-foreground/50 max-w-xs">
          Help other students by leaving the first review on Rate My Professor or Reddit.
        </p>
      </div>
    )
  }

  const overallColor = getScoreColor(result.overallRating)
  const classColor = getScoreColor(result.classSpecificRating)

  const ratingDiff =
    result.overallRating !== null &&
    result.classSpecificRating !== null
      ? result.classSpecificRating - result.overallRating
      : null

  return (
    <div className="flex flex-col gap-6">
      
      {/* VERDICT BANNER */}
      {result.verdict && (
        <div className={cn(
          'flex items-center justify-center gap-3 py-5 px-6 rounded-2xl border',
          result.verdict === 'take' && 'bg-score-green-bg border-score-green/30 glow-green',
          result.verdict === 'avoid' && 'bg-score-red-bg border-score-red/30 glow-red',
          result.verdict === 'mixed' && 'bg-surface-2 border-border/50',
        )}>
          {result.verdict === 'take' && <CheckCircle2 size={24} className="text-score-green" />}
          {result.verdict === 'avoid' && <XCircle size={24} className="text-score-red" />}
          {result.verdict === 'mixed' && <AlertTriangle size={24} className="text-score-yellow" />}
          <span className={cn(
            'text-2xl font-bold tracking-tight',
            result.verdict === 'take' && 'text-score-green',
            result.verdict === 'avoid' && 'text-score-red',
            result.verdict === 'mixed' && 'text-score-yellow',
          )}>
            {result.verdict === 'take' && 'TAKE THIS CLASS'}
            {result.verdict === 'avoid' && 'AVOID IF POSSIBLE'}
            {result.verdict === 'mixed' && 'MIXED REVIEWS'}
          </span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              {searchQuery.professor}
            </h2>
            <ChevronRight size={14} className="text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground/70">{searchQuery.university}</span>
          </div>
          {result.courseCode && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-white bg-white/10 border border-white/10 px-2.5 py-1 rounded-full font-mono font-medium">
                <BookOpen size={11} />
                {result.courseCode}
              </span>
              {result.courseFullName && (
                <span className="text-xs text-muted-foreground/60">{result.courseFullName}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Share button */}
        <button
          onClick={handleShare}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-surface-2 border border-border/40 text-sm text-muted-foreground',
            'hover:text-white hover:border-white/20 transition-all duration-200',
          )}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Source badges */}
      {result.sources && result.sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.sources.map((src, i) => (
            <SourceBadge
              key={i}
              type={src.type}
              name={src.name}
              reviewCount={src.reviewCount}
              url={src.url}
            />
          ))}
        </div>
      )}

      {/* Big stats row: Rating, Would Take Again, Difficulty */}
      <div className="grid grid-cols-3 gap-4">
        {/* Class-specific Rating */}
        <div className={cn(
          'flex flex-col items-center justify-center p-5 rounded-2xl border text-center',
          'bg-surface-1 border-border/40',
        )}>
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
            {result.courseCode || 'Class'} Rating
          </span>
          <span className={cn(
            'text-5xl font-bold tabular-nums leading-none',
            {
              'text-score-green': classColor === 'green',
              'text-score-yellow': classColor === 'yellow',
              'text-score-red': classColor === 'red',
              'text-muted-foreground': classColor === 'neutral',
            }
          )}>
            {result.classSpecificRating?.toFixed(1) ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground/50 mt-1">
            from {result.classSpecificRatingCount?.toLocaleString() ?? 0} reviews
          </span>
        </div>

        {/* Would Take Again */}
        <div className={cn(
          'flex flex-col items-center justify-center p-5 rounded-2xl border text-center',
          'bg-surface-1 border-border/40',
        )}>
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
            Would Take Again
          </span>
          <span className={cn(
            'text-5xl font-bold tabular-nums leading-none',
            {
              'text-score-green': (result.wouldTakeAgain ?? 0) >= 70,
              'text-score-yellow': (result.wouldTakeAgain ?? 0) >= 50 && (result.wouldTakeAgain ?? 0) < 70,
              'text-score-red': (result.wouldTakeAgain ?? 0) < 50 && result.wouldTakeAgain !== null,
              'text-muted-foreground': result.wouldTakeAgain === null,
            }
          )}>
            {result.wouldTakeAgain !== null ? `${result.wouldTakeAgain}%` : '—'}
          </span>
          <span className="text-xs text-muted-foreground/50 mt-1 flex items-center gap-1">
            <Users size={10} />
            of students
          </span>
        </div>

        {/* Difficulty */}
        <div className={cn(
          'flex flex-col items-center justify-center p-5 rounded-2xl border text-center',
          'bg-surface-1 border-border/40',
        )}>
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
            Difficulty
          </span>
          <span className="text-5xl font-bold tabular-nums leading-none text-white">
            {result.difficulty?.toFixed(1) ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground/50 mt-1">out of 5.0</span>
        </div>
      </div>

      {/* Rating comparison: Overall vs Class-specific */}
      <div className="grid grid-cols-2 gap-4">
        {/* Overall rating */}
        <div className="flex flex-col gap-2 p-4 bg-surface-1 border border-border/30 rounded-xl">
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            Overall Rating
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn('text-3xl font-bold tabular-nums', {
                'text-score-green': overallColor === 'green',
                'text-score-yellow': overallColor === 'yellow',
                'text-score-red': overallColor === 'red',
                'text-muted-foreground': overallColor === 'neutral',
              })}
            >
              {result.overallRating?.toFixed(1) ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground/50">
              / 5 from {result.overallRatingCount?.toLocaleString()} reviews
            </span>
          </div>
        </div>

        {/* Rating trend */}
        {result.reviewTrend && (
          <div className={cn(
            'flex flex-col gap-2 p-4 rounded-xl border',
            result.reviewTrend.direction === 'up' && 'bg-score-green-bg/50 border-score-green/20',
            result.reviewTrend.direction === 'down' && 'bg-score-red-bg/50 border-score-red/20',
            result.reviewTrend.direction === 'stable' && 'bg-surface-1 border-border/30',
          )}>
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
              Review Trend
            </span>
            <div className="flex items-center gap-2">
              {result.reviewTrend.direction === 'up' && (
                <>
                  <ArrowUp size={20} className="text-score-green" />
                  <span className="text-sm text-score-green font-medium">Improving</span>
                </>
              )}
              {result.reviewTrend.direction === 'down' && (
                <>
                  <ArrowDown size={20} className="text-score-red" />
                  <span className="text-sm text-score-red font-medium">Declining</span>
                </>
              )}
              {result.reviewTrend.direction === 'stable' && (
                <>
                  <Minus size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-medium">Stable</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rating gap insight */}
      {ratingDiff !== null && Math.abs(ratingDiff) >= 0.2 && (
        <div
          className={cn(
            'flex items-center gap-3 px-5 py-4 rounded-xl border text-sm',
            ratingDiff > 0
              ? 'bg-score-green-bg border-score-green/20 text-score-green'
              : 'bg-score-red-bg border-score-red/20 text-score-red',
          )}
        >
          {ratingDiff > 0 ? (
            <TrendingUp size={18} className="shrink-0" />
          ) : (
            <TrendingDown size={18} className="shrink-0" />
          )}
          <span>
            {ratingDiff > 0
              ? `Students rate this professor ${Math.abs(ratingDiff).toFixed(1)} points higher in ${result.courseCode ?? searchQuery.classQuery}.`
              : `Students rate this professor ${Math.abs(ratingDiff).toFixed(1)} points lower in ${result.courseCode ?? searchQuery.classQuery}.`}
          </span>
        </div>
      )}

      {/* Grade Distribution */}
      {result.gradeDistribution && (
        <div className="p-5 bg-surface-1 border border-border/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              Grade Distribution
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <GradeBar grade="A" percentage={result.gradeDistribution.A} color="bg-score-green" />
            <GradeBar grade="B" percentage={result.gradeDistribution.B} color="bg-score-green/70" />
            <GradeBar grade="C" percentage={result.gradeDistribution.C} color="bg-score-yellow" />
            <GradeBar grade="D" percentage={result.gradeDistribution.D} color="bg-score-red/70" />
            <GradeBar grade="F" percentage={result.gradeDistribution.F} color="bg-score-red" />
          </div>
        </div>
      )}

      {/* AI Summary */}
      {result.aiSummary && (
        <div className="p-5 bg-surface-1 border border-border/30 rounded-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-white" />
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
              AI Summary
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{result.aiSummary}</p>
          {result.classSpecificInsights && (
            <div className="pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-muted-foreground/60" />
                <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                  About {result.courseCode ?? searchQuery.classQuery}
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                {result.classSpecificInsights}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Standout quote */}
      {result.standoutQuote && (
        <div className="px-5 py-4 bg-surface-2/50 border border-border/30 rounded-xl flex items-start gap-3">
          <MessageSquareQuote size={16} className="text-white/40 shrink-0 mt-0.5" />
          <blockquote className="text-sm text-white/70 italic leading-relaxed">
            &ldquo;{result.standoutQuote}&rdquo;
          </blockquote>
        </div>
      )}

      {/* Pros & Cons */}
      {(result.pros?.length || result.cons?.length) && (
        <div className="grid grid-cols-2 gap-4">
          {result.pros && result.pros.length > 0 && (
            <div className="p-4 bg-surface-1 border border-border/30 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Plus size={13} className="text-score-green" />
                <span className="text-xs font-medium text-score-green uppercase tracking-wider">
                  Pros
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {result.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
                    <CheckCircle2 size={12} className="text-score-green/60 shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.cons && result.cons.length > 0 && (
            <div className="p-4 bg-surface-1 border border-border/30 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Minus size={13} className="text-score-red" />
                <span className="text-xs font-medium text-score-red uppercase tracking-wider">
                  Cons
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {result.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
                    <XCircle size={12} className="text-score-red/60 shrink-0 mt-0.5" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {result.tags && result.tags.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
            Student Tags
          </span>
          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1.5 bg-surface-2 border border-border/30 rounded-full text-xs text-white/70 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No class-specific data warning + First to Rate CTA */}
      {!result.hasClassSpecificData && (
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-score-yellow/20 bg-score-yellow-bg/50 text-center">
          <AlertTriangle size={24} className="text-score-yellow" />
          <div>
            <p className="text-sm font-medium text-score-yellow mb-1">No class-specific reviews yet</p>
            <p className="text-xs text-score-yellow/70 max-w-sm">
              The rating above is estimated from overall data. Help future students!
            </p>
          </div>
          <a
            href="https://www.ratemyprofessors.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg',
              'bg-white text-black font-medium text-sm',
              'hover:bg-white/90 transition-all duration-200',
            )}
          >
            <Plus size={14} />
            Be the First to Review {result.courseCode}
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-2 pt-3 border-t border-border/20">
        <AlertTriangle size={11} className="text-muted-foreground/30 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
          Data synthesized from Rate My Professor, Reddit, and publicly available sources. Results are AI-generated and may not reflect the most recent reviews.
        </p>
      </div>
    </div>
  )
}
