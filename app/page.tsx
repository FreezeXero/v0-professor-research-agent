'use client'

import { useState, useCallback } from 'react'
import { SearchForm } from '@/components/search-form'
import { ResultsDashboard } from '@/components/results-dashboard'
import { AgentStatus } from '@/components/agent-status'
import type { ResearchResult } from '@/app/api/research/route'
import { cn } from '@/lib/utils'
import { GraduationCap, Layers, AlertCircle, RotateCcw } from 'lucide-react'

interface SearchQuery {
  university: string
  professor: string
  classQuery: string
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null)

  const handleSearch = useCallback(async (query: SearchQuery) => {
    setIsLoading(true)
    setResult(null)
    setError(null)
    setSearchQuery(query)

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Research failed. Please try again.')
      }

      const data: ResearchResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleReset = useCallback(() => {
    setResult(null)
    setError(null)
    setSearchQuery(null)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border/60 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <GraduationCap size={14} className="text-accent-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">ProfLens</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Layers size={12} />
          <span>AI Research Agent</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-10 md:py-16">
        <div className="w-full max-w-[960px] flex flex-col gap-8">
          {/* Hero */}
          <div className={cn('flex flex-col gap-3 transition-all duration-500', result || isLoading ? 'hidden md:block' : '')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Powered by AI
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-balance">
              Research any professor,
              <br />
              <span className="text-muted-foreground font-normal">
                before you register.
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              ProfLens searches Rate My Professor and Reddit to surface class-specific ratings — not
              just the overall average. See exactly what students say about your professor in your
              specific course.
            </p>
          </div>

          {/* Main layout */}
          <div
            className={cn(
              'flex gap-6 transition-all duration-300',
              result || isLoading ? 'flex-col md:flex-row items-start' : 'flex-col',
            )}
          >
            {/* Search panel */}
            <div
              className={cn(
                'w-full transition-all duration-300',
                result || isLoading
                  ? 'md:w-[320px] md:shrink-0 md:sticky md:top-[73px]'
                  : 'max-w-[480px] mx-auto',
              )}
            >
              <div className="flex flex-col gap-4 p-5 bg-surface-1 border border-border rounded-2xl">
                {/* Panel header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Find a Professor</span>
                  {(result || error) && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcw size={11} />
                      New search
                    </button>
                  )}
                </div>

                <SearchForm onSearch={handleSearch} isLoading={isLoading} />

                {/* Agent status during loading */}
                {isLoading && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Agent working...</p>
                    <AgentStatus isLoading={isLoading} />
                  </div>
                )}
              </div>

              {/* Feature callouts — only show when no result */}
              {!result && !isLoading && !error && (
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { icon: '→', text: 'Maps "calc 3" to MATH 126 automatically' },
                    { icon: '→', text: 'Class-specific vs overall ratings side-by-side' },
                    { icon: '→', text: 'Review count shown next to every score' },
                    { icon: '→', text: 'Plain-English AI summary of student sentiment' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground/70 px-1">
                      <span className="text-muted-foreground/40 shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results panel */}
            {(result || error) && (
              <div className="flex-1 min-w-0">
                {error ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="w-10 h-10 rounded-full bg-score-red-bg border border-score-red/20 flex items-center justify-center">
                      <AlertCircle size={18} className="text-score-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Research Failed</p>
                      <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
                    </div>
                  </div>
                ) : result && searchQuery ? (
                  <div className="p-5 bg-surface-1 border border-border rounded-2xl">
                    <ResultsDashboard result={result} searchQuery={searchQuery} />
                  </div>
                ) : null}
              </div>
            )}

            {/* Empty state — when no result yet and not loading */}
            {!result && !isLoading && !error && (
              <div className="hidden md:flex flex-1 flex-col items-center justify-center py-16 gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center"
                  aria-hidden="true"
                >
                  <GraduationCap size={28} className="text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60 mb-1">
                    Your research results will appear here
                  </p>
                  <p className="text-xs text-muted-foreground/40 max-w-xs">
                    Enter a university, professor name, and class to get started.
                  </p>
                </div>

                {/* Example searches */}
                <div className="mt-2 flex flex-col gap-2 max-w-xs w-full">
                  <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider text-left">
                    Example searches
                  </p>
                  {[
                    { school: 'University of Washington', prof: 'John Braun', class: 'Calc 3' },
                    { school: 'MIT', prof: 'Patrick Winston', class: 'Intro to AI' },
                    { school: 'UCLA', prof: 'Zach Hamaker', class: 'Linear Algebra' },
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        handleSearch({
                          university: ex.school,
                          professor: ex.prof,
                          classQuery: ex.class,
                        })
                      }
                      className="text-left px-3 py-2.5 rounded-lg bg-surface-2 border border-border hover:border-accent/30 hover:bg-surface-3 transition-colors group"
                    >
                      <p className="text-xs font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                        {ex.prof}
                      </p>
                      <p className="text-[11px] text-muted-foreground/50">
                        {ex.school} · {ex.class}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-4 px-5">
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground/40">ProfLens</span>
          <span className="text-xs text-muted-foreground/40">
            AI-synthesized from publicly available sources
          </span>
        </div>
      </footer>
    </div>
  )
}
