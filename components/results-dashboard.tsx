'use client'

import { cn } from '@/lib/utils'
import { ScoreBadge, ScoreBar, getScoreColor } from '@/components/score-badge'
import { SourceBadge } from '@/components/source-badge'
import type { ResearchResult } from '@/app/api/research/route'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  MessageSquareQuote,
  Minus,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'

interface ResultsDashboardProps {
  result: ResearchResult
  searchQuery: {
    university: string
    professor: string
    classQuery: string
  }
}

export function ResultsDashboard({ result, searchQuery }: ResultsDashboardProps) {
  if (!result.professorFound) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center">
          <XCircle size={22} className="text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1">Professor Not Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {result.notFoundReason ||
              `We couldn't find ${searchQuery.professor} at ${searchQuery.university} in our research data.`}
          </p>
        </div>
        <div className="mt-2 px-4 py-3 bg-surface-2 border border-border rounded-lg max-w-sm">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Be the first to rate this professor on{' '}
            <a
              href="https://www.ratemyprofessors.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Rate My Professor
            </a>{' '}
            or share your experience on Reddit.
          </p>
        </div>
      </div>
    )
  }

  const overallColor = getScoreColor(result.overallRating)
  const classColor = getScoreColor(result.classSpecificRating)

  const ratingDiff =
    result.overallRating !== null &&
    result.classSpecificRating !== null &&
    result.overallRating !== undefined &&
    result.classSpecificRating !== undefined
      ? result.classSpecificRating - result.overallRating
      : null

  return (
    <div className="flex flex-col gap-5">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              {searchQuery.professor}
            </h2>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{searchQuery.university}</span>
          </div>
          {result.courseCode && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full font-mono font-medium">
                <BookOpen size={11} />
                {result.courseCode}
              </span>
              {result.courseFullName && (
                <span className="text-xs text-muted-foreground">{result.courseFullName}</span>
              )}
            </div>
          )}
        </div>
        {/* Source badges */}
        {result.sources && result.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
      </div>

      {/* Ratings comparison — the hero section */}
      <div className="grid grid-cols-2 gap-3">
        {/* Overall rating */}
        <div className="flex flex-col gap-3 p-4 bg-surface-1 border border-border rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Overall Rating
            </span>
            <span className="text-xs text-muted-foreground">All classes</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <span
                className={cn('text-5xl font-bold leading-none tabular-nums', {
                  'text-score-green': overallColor === 'green',
                  'text-score-yellow': overallColor === 'yellow',
                  'text-score-red': overallColor === 'red',
                  'text-muted-foreground': overallColor === 'neutral',
                })}
              >
                {result.overallRating?.toFixed(1) ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">/ 5.0</span>
            </div>
            <div className="flex flex-col gap-0.5 pb-0.5">
              <span className="text-xs font-semibold text-foreground">
                {result.overallRatingCount?.toLocaleString() ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground">reviews</span>
            </div>
          </div>
        </div>

        {/* Class-specific rating */}
        <div
          className={cn(
            'flex flex-col gap-3 p-4 border rounded-xl relative overflow-hidden',
            result.hasClassSpecificData
              ? 'bg-surface-1 border-accent/30'
              : 'bg-surface-1 border-border',
          )}
        >
          {result.hasClassSpecificData && (
            <div className="absolute inset-0 bg-accent/3 pointer-events-none" />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {result.courseCode ?? searchQuery.classQuery} Rating
            </span>
            {result.hasClassSpecificData ? (
              <span className="text-xs text-accent">Class-specific</span>
            ) : (
              <span className="text-xs text-muted-foreground">Estimated</span>
            )}
          </div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col">
              <span
                className={cn('text-5xl font-bold leading-none tabular-nums', {
                  'text-score-green': classColor === 'green',
                  'text-score-yellow': classColor === 'yellow',
                  'text-score-red': classColor === 'red',
                  'text-muted-foreground': classColor === 'neutral',
                })}
              >
                {result.classSpecificRating?.toFixed(1) ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">/ 5.0</span>
            </div>
            <div className="flex flex-col gap-0.5 pb-0.5">
              <span className="text-xs font-semibold text-foreground">
                {result.classSpecificRatingCount?.toLocaleString() ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground">reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating gap insight */}
      {ratingDiff !== null && Math.abs(ratingDiff) >= 0.1 && (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm',
            ratingDiff > 0
              ? 'bg-score-green-bg border-score-green/20 text-score-green'
              : 'bg-score-red-bg border-score-red/20 text-score-red',
          )}
        >
          {ratingDiff > 0 ? (
            <TrendingUp size={16} className="shrink-0" />
          ) : (
            <TrendingDown size={16} className="shrink-0" />
          )}
          <span>
            {ratingDiff > 0
              ? `Students rate this professor ${Math.abs(ratingDiff).toFixed(1)} points higher in ${result.courseCode ?? searchQuery.classQuery} than their overall average.`
              : `Students rate this professor ${Math.abs(ratingDiff).toFixed(1)} points lower in ${result.courseCode ?? searchQuery.classQuery} compared to their overall average.`}
          </span>
        </div>
      )}

      {/* No class-specific data warning */}
      {!result.hasClassSpecificData && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-score-yellow/20 bg-score-yellow-bg text-score-yellow text-sm">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">No class-specific reviews found</span>
            <p className="text-score-yellow/80 text-xs mt-0.5 font-normal">
              The class-specific rating is estimated from available data. Be the first to leave a review
              specific to {result.courseCode ?? searchQuery.classQuery}!
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-surface-1 border border-border rounded-xl flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Difficulty
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {result.difficulty?.toFixed(1) ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
          <p className="text-xs text-muted-foreground">Higher = harder</p>
        </div>
        <div className="p-4 bg-surface-1 border border-border rounded-xl flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Would Take Again
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={cn('text-2xl font-bold tabular-nums', {
              'text-score-green': (result.wouldTakeAgain ?? 0) >= 74,
              'text-score-yellow': (result.wouldTakeAgain ?? 0) >= 55 && (result.wouldTakeAgain ?? 0) < 74,
              'text-score-red': (result.wouldTakeAgain ?? 0) < 55 && result.wouldTakeAgain !== null,
              'text-muted-foreground': result.wouldTakeAgain === null,
            })}>
              {result.wouldTakeAgain !== null && result.wouldTakeAgain !== undefined
                ? `${result.wouldTakeAgain}%`
                : '—'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">of students</p>
        </div>
      </div>

      {/* AI Summary */}
      {result.aiSummary && (
        <div className="p-4 bg-surface-1 border border-border rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs font-medium text-accent uppercase tracking-wider">
              AI Summary
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{result.aiSummary}</p>
          {result.classSpecificInsights && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={13} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  About {result.courseCode ?? searchQuery.classQuery} specifically
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {result.classSpecificInsights}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Standout quote */}
      {result.standoutQuote && (
        <div className="px-4 py-3.5 bg-surface-2 border border-border rounded-xl flex items-start gap-3">
          <MessageSquareQuote size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <blockquote className="text-sm text-foreground/80 italic leading-relaxed">
            &ldquo;{result.standoutQuote}&rdquo;
          </blockquote>
        </div>
      )}

      {/* Pros & Cons */}
      {(result.pros?.length || result.cons?.length) && (
        <div className="grid grid-cols-2 gap-3">
          {result.pros && result.pros.length > 0 && (
            <div className="p-4 bg-surface-1 border border-border rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Plus size={13} className="text-score-green" />
                <span className="text-xs font-medium text-score-green uppercase tracking-wider">
                  Pros
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {result.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                    <CheckCircle2 size={12} className="text-score-green/70 shrink-0 mt-0.5" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.cons && result.cons.length > 0 && (
            <div className="p-4 bg-surface-1 border border-border rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Minus size={13} className="text-score-red" />
                <span className="text-xs font-medium text-score-red uppercase tracking-wider">
                  Cons
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {result.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                    <XCircle size={12} className="text-score-red/70 shrink-0 mt-0.5" />
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
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Student Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {result.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 bg-surface-2 border border-border rounded-full text-xs text-foreground/80 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-2 pt-2 border-t border-border">
        <AlertTriangle size={12} className="text-muted-foreground/50 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
          Data synthesized from Rate My Professor, Reddit, and publicly available academic sources via AI analysis. Results reflect AI training data and may not capture the most recent reviews. Always cross-reference with current sources.
        </p>
      </div>
    </div>
  )
}
