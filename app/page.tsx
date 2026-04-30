'use client'

import { useState, useCallback, useEffect } from 'react'
import { SearchForm } from '@/components/search-form'
import { ResultsDashboard } from '@/components/results-dashboard'
import { AgentStatus } from '@/components/agent-status'
import type { ResearchResult } from '@/app/api/research/route'
import { cn } from '@/lib/utils'
import { GraduationCap, Layers, AlertCircle, RotateCcw, Plus, X } from 'lucide-react'

interface SearchQuery {
  university: string
  professor: string
  classQuery: string
}

interface ResearchState {
  result: ResearchResult | null
  error: string | null
  isLoading: boolean
  searchQuery: SearchQuery | null
}

export default function HomePage() {
  // Primary search
  const [primary, setPrimary] = useState<ResearchState>({
    result: null,
    error: null,
    isLoading: false,
    searchQuery: null,
  })
  
  // Compare mode
  const [compareMode, setCompareMode] = useState(false)
  const [compare, setCompare] = useState<ResearchState>({
    result: null,
    error: null,
    isLoading: false,
    searchQuery: null,
  })

  // Handle URL params for sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const u = params.get('u')
    const p = params.get('p')
    const c = params.get('c')
    
    if (u && p) {
      handleSearch({ university: u, professor: p, classQuery: c || '' }, 'primary')
    }
  }, [])

  const handleSearch = useCallback(async (query: SearchQuery, target: 'primary' | 'compare') => {
    const setState = target === 'primary' ? setPrimary : setCompare
    
    setState({
      result: null,
      error: null,
      isLoading: true,
      searchQuery: query,
    })

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
      setState(prev => ({ ...prev, result: data, isLoading: false }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Something went wrong.',
        isLoading: false,
      }))
    }
  }, [])

  const handleReset = useCallback((target: 'primary' | 'compare' | 'all') => {
    if (target === 'primary' || target === 'all') {
      setPrimary({ result: null, error: null, isLoading: false, searchQuery: null })
    }
    if (target === 'compare' || target === 'all') {
      setCompare({ result: null, error: null, isLoading: false, searchQuery: null })
      if (target === 'compare') setCompareMode(false)
    }
  }, [])

  const showResults = primary.result || primary.isLoading || primary.error

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Subtle radial gradient at top */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% -10%, oklch(0.12 0.04 250 / 0.5), transparent)',
        }}
        aria-hidden="true"
      />
      
      {/* Nav */}
      <header className="relative z-40 flex items-center justify-between px-6 py-4 border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center glow-strong">
            <GraduationCap size={18} className="text-black" />
          </div>
          <span className="text-[16px] font-semibold text-white tracking-tight">ProfLens</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
          <Layers size={12} />
          <span className="hidden sm:inline">AI Research Agent</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-6 py-10 md:py-16">
        <div className="w-full max-w-[1100px] flex flex-col gap-8">
          
          {/* Hero - hide when showing results */}
          {!showResults && (
            <div className="flex flex-col gap-4 items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  AI-Powered
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight text-balance leading-tight">
                Research any professor,
                <br />
                <span className="text-muted-foreground/60 font-normal">
                  before you register.
                </span>
              </h1>
              <p className="text-sm text-muted-foreground/70 max-w-lg leading-relaxed">
                ProfLens searches Rate My Professor and Reddit to surface class-specific ratings. 
                See what students say about your professor in your specific course.
              </p>
            </div>
          )}

          {/* Main layout */}
          <div className={cn(
            'flex gap-6 transition-all duration-300',
            showResults ? 'flex-col lg:flex-row items-start' : 'flex-col items-center',
          )}>
            
            {/* Search panel */}
            <div className={cn(
              'w-full transition-all duration-300',
              showResults
                ? 'lg:w-[340px] lg:shrink-0 lg:sticky lg:top-[73px]'
                : 'max-w-[480px]',
            )}>
              <div className={cn(
                'flex flex-col gap-5 p-6 rounded-2xl border',
                'bg-surface-1/60 backdrop-blur-xl border-border/30',
                'glow',
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Find a Professor</span>
                  {(primary.result || primary.error) && (
                    <button
                      onClick={() => handleReset('all')}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-white transition-colors"
                    >
                      <RotateCcw size={11} />
                      New search
                    </button>
                  )}
                </div>

                <SearchForm onSearch={(q) => handleSearch(q, 'primary')} isLoading={primary.isLoading} />

                {primary.isLoading && (
                  <div className="border-t border-border/20 pt-4">
                    <p className="text-xs text-muted-foreground/50 mb-3 font-medium">Researching...</p>
                    <AgentStatus isLoading={primary.isLoading} />
                  </div>
                )}
              </div>

              {/* Feature callouts */}
              {!showResults && (
                <div className="mt-4 flex flex-col gap-2">
                  {[
                    'Maps "calc 3" to MATH 126 automatically',
                    'Class-specific vs overall ratings side-by-side',
                    'Grade distributions and review trends',
                    'AI summary of student sentiment',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground/40 px-1">
                      <span className="text-muted-foreground/30 shrink-0">→</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {showResults && (
              <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-6">
                
                {/* Primary result */}
                <div className={cn('flex-1 min-w-0', compareMode && 'lg:max-w-[50%]')}>
                  {primary.error ? (
                    <div className="flex flex-col items-center gap-4 py-12 text-center p-6 bg-surface-1/60 border border-border/30 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-score-red-bg border border-score-red/20 flex items-center justify-center">
                        <AlertCircle size={20} className="text-score-red" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Research Failed</p>
                        <p className="text-xs text-muted-foreground/60 max-w-sm">{primary.error}</p>
                      </div>
                    </div>
                  ) : primary.result && primary.searchQuery ? (
                    <div className={cn(
                      'p-6 rounded-2xl border',
                      'bg-surface-1/60 backdrop-blur-xl border-border/30',
                      'glow',
                    )}>
                      <ResultsDashboard result={primary.result} searchQuery={primary.searchQuery} />
                    </div>
                  ) : null}
                </div>

                {/* Compare panel */}
                {compareMode && (
                  <div className="flex-1 min-w-0 lg:max-w-[50%]">
                    {!compare.result && !compare.isLoading && !compare.error ? (
                      <div className={cn(
                        'flex flex-col gap-5 p-6 rounded-2xl border h-full',
                        'bg-surface-1/60 backdrop-blur-xl border-border/30',
                      )}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">Compare Professor</span>
                          <button
                            onClick={() => setCompareMode(false)}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <X size={14} className="text-muted-foreground/50" />
                          </button>
                        </div>
                        <SearchForm 
                          onSearch={(q) => handleSearch({ ...q, classQuery: primary.searchQuery?.classQuery || q.classQuery }, 'compare')} 
                          isLoading={compare.isLoading}
                          defaultUniversity={primary.searchQuery?.university}
                          defaultClass={primary.searchQuery?.classQuery}
                        />
                      </div>
                    ) : compare.error ? (
                      <div className="flex flex-col items-center gap-4 py-12 text-center p-6 bg-surface-1/60 border border-border/30 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-score-red-bg border border-score-red/20 flex items-center justify-center">
                          <AlertCircle size={20} className="text-score-red" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white mb-1">Research Failed</p>
                          <p className="text-xs text-muted-foreground/60 max-w-sm">{compare.error}</p>
                        </div>
                        <button
                          onClick={() => handleReset('compare')}
                          className="text-xs text-muted-foreground hover:text-white transition-colors"
                        >
                          Try again
                        </button>
                      </div>
                    ) : compare.result && compare.searchQuery ? (
                      <div className={cn(
                        'p-6 rounded-2xl border relative',
                        'bg-surface-1/60 backdrop-blur-xl border-border/30',
                        'glow',
                      )}>
                        <button
                          onClick={() => handleReset('compare')}
                          className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg transition-colors z-10"
                        >
                          <X size={14} className="text-muted-foreground/50" />
                        </button>
                        <ResultsDashboard result={compare.result} searchQuery={compare.searchQuery} />
                      </div>
                    ) : compare.isLoading ? (
                      <div className={cn(
                        'flex flex-col items-center justify-center gap-4 py-16 p-6 rounded-2xl border',
                        'bg-surface-1/60 backdrop-blur-xl border-border/30',
                      )}>
                        <AgentStatus isLoading={true} />
                        <p className="text-xs text-muted-foreground/50">Researching comparison...</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Compare button - show when we have a primary result and not in compare mode */}
                {primary.result && !compareMode && (
                  <button
                    onClick={() => setCompareMode(true)}
                    className={cn(
                      'fixed bottom-6 right-6 lg:relative lg:bottom-auto lg:right-auto',
                      'flex items-center gap-2 px-5 py-3 rounded-xl',
                      'bg-white text-black font-medium text-sm',
                      'hover:bg-white/90 transition-all duration-200',
                      'glow-strong',
                      'lg:self-start lg:mt-0',
                    )}
                  >
                    <Plus size={16} />
                    Compare Professor
                  </button>
                )}
              </div>
            )}

            {/* Empty state with example searches */}
            {!showResults && (
              <div className="hidden md:flex flex-col items-center justify-center py-8 gap-4 text-center max-w-md mx-auto">
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider text-left">
                    Try an example
                  </p>
                  {[
                    { school: 'University of Washington - Seattle', prof: 'John Braun', class: 'Calc 3' },
                    { school: 'Massachusetts Institute of Technology', prof: 'Patrick Winston', class: 'Intro to AI' },
                    { school: 'University of California, Los Angeles', prof: 'Zach Hamaker', class: 'Linear Algebra' },
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch({ university: ex.school, professor: ex.prof, classQuery: ex.class }, 'primary')}
                      className={cn(
                        'text-left px-4 py-3 rounded-xl',
                        'bg-surface-1/50 border border-border/30',
                        'hover:border-white/20 hover:bg-surface-2/50 transition-all duration-200',
                        'group',
                      )}
                    >
                      <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                        {ex.prof}
                      </p>
                      <p className="text-xs text-muted-foreground/40">
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
      <footer className="relative z-10 border-t border-border/20 py-5 px-6">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/30 font-medium">ProfLens</span>
          <span className="text-[10px] text-muted-foreground/20">
            AI-synthesized from publicly available sources
          </span>
        </div>
      </footer>
    </div>
  )
}
