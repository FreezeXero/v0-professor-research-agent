'use client'

import { useState, useCallback } from 'react'
import { UniversityAutocomplete } from '@/components/university-autocomplete'
import { cn } from '@/lib/utils'
import { BookOpen, Search, User, Loader2, Sparkles } from 'lucide-react'

interface SearchFormProps {
  onSearch: (query: { university: string; professor: string; classQuery: string }) => void
  isLoading: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [university, setUniversity] = useState('')
  const [professor, setProfessor] = useState('')
  const [classQuery, setClassQuery] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!university.trim() || !professor.trim()) return
      onSearch({ university: university.trim(), professor: professor.trim(), classQuery: classQuery.trim() })
    },
    [university, professor, classQuery, onSearch],
  )

  const isValid = university.trim().length > 0 && professor.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* University */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest px-1">
          <span className="w-1 h-1 rounded-full bg-accent/60" />
          University
        </label>
        <UniversityAutocomplete
          value={university}
          onChange={setUniversity}
          placeholder="Search 500+ universities..."
          disabled={isLoading}
        />
      </div>

      {/* Professor */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest px-1">
          <span className="w-1 h-1 rounded-full bg-accent/60" />
          Professor
        </label>
        <div className="relative flex items-center group">
          <User
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200',
              focused === 'professor' ? 'text-accent' : 'text-muted-foreground/70',
            )}
            size={16}
          />
          <input
            type="text"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            onFocus={() => setFocused('professor')}
            onBlur={() => setFocused(null)}
            placeholder="e.g. Dr. Sarah Chen"
            disabled={isLoading}
            className={cn(
              'w-full bg-surface-1 border border-border/60 rounded-xl',
              'pl-11 pr-4 py-3.5 text-[15px] text-foreground',
              'placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60',
              'hover:border-border hover:bg-surface-2/50',
              'transition-all duration-200 ease-out',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-1',
            )}
          />
        </div>
      </div>

      {/* Class */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-widest px-1">
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span>Class</span>
          <span className="normal-case font-normal tracking-normal text-muted-foreground/50 ml-1">
            optional
          </span>
        </label>
        <div className="relative flex items-center group">
          <BookOpen
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200',
              focused === 'class' ? 'text-accent' : 'text-muted-foreground/70',
            )}
            size={16}
          />
          <input
            type="text"
            value={classQuery}
            onChange={(e) => setClassQuery(e.target.value)}
            onFocus={() => setFocused('class')}
            onBlur={() => setFocused(null)}
            placeholder="e.g. calc 3, intro to psych, data structures"
            disabled={isLoading}
            className={cn(
              'w-full bg-surface-1 border border-border/60 rounded-xl',
              'pl-11 pr-4 py-3.5 text-[15px] text-foreground',
              'placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60',
              'hover:border-border hover:bg-surface-2/50',
              'transition-all duration-200 ease-out',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-1',
            )}
          />
        </div>
        <p className="flex items-start gap-2 text-[12px] text-muted-foreground/50 px-1 leading-relaxed">
          <Sparkles size={12} className="shrink-0 mt-0.5 text-accent/50" />
          <span>
            Our AI maps informal names to real course codes and finds class-specific reviews.
          </span>
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={cn(
          'mt-2 w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-[15px] font-semibold',
          'bg-accent text-white',
          'shadow-lg shadow-accent/20',
          'transition-all duration-200 ease-out',
          'hover:shadow-xl hover:shadow-accent/30 hover:brightness-110',
          'active:scale-[0.98] active:shadow-md',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 disabled:hover:brightness-100',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background',
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Researching...</span>
          </>
        ) : (
          <>
            <Search size={18} />
            <span>Research Professor</span>
          </>
        )}
      </button>
    </form>
  )
}
