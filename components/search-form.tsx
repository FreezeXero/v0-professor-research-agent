'use client'

import { useState, useCallback, useEffect } from 'react'
import { UniversityAutocomplete } from '@/components/university-autocomplete'
import { cn } from '@/lib/utils'
import { BookOpen, Search, User, Loader2, Sparkles } from 'lucide-react'

interface SearchFormProps {
  onSearch: (query: { university: string; professor: string; classQuery: string }) => void
  isLoading: boolean
  defaultUniversity?: string
  defaultClass?: string
}

export function SearchForm({ onSearch, isLoading, defaultUniversity, defaultClass }: SearchFormProps) {
  const [university, setUniversity] = useState(defaultUniversity || '')
  const [professor, setProfessor] = useState('')
  const [classQuery, setClassQuery] = useState(defaultClass || '')
  const [focused, setFocused] = useState<string | null>(null)

  // Sync defaults when they change
  useEffect(() => {
    if (defaultUniversity) setUniversity(defaultUniversity)
    if (defaultClass) setClassQuery(defaultClass)
  }, [defaultUniversity, defaultClass])

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
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-1">
          <span className="w-1 h-1 rounded-full bg-white/40" />
          University
        </label>
        <UniversityAutocomplete
          value={university}
          onChange={setUniversity}
          placeholder="Search 300+ universities..."
          disabled={isLoading}
        />
      </div>

      {/* Professor */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-1">
          <span className="w-1 h-1 rounded-full bg-white/40" />
          Professor
        </label>
        <div className="relative flex items-center group">
          <User
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300',
              focused === 'professor' ? 'text-white' : 'text-muted-foreground/60',
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
              'w-full bg-surface-1 border border-border/50 rounded-xl',
              'pl-11 pr-4 py-4 text-[15px] text-white',
              'placeholder:text-muted-foreground/40',
              'focus:outline-none focus:border-white/30 focus:glow-input',
              'hover:border-border hover:bg-surface-2/30',
              'transition-all duration-300 ease-out',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-1',
            )}
          />
        </div>
      </div>

      {/* Class */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-1">
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>Class</span>
          <span className="normal-case font-normal tracking-normal text-muted-foreground/40 ml-1">
            optional
          </span>
        </label>
        <div className="relative flex items-center group">
          <BookOpen
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300',
              focused === 'class' ? 'text-white' : 'text-muted-foreground/60',
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
              'w-full bg-surface-1 border border-border/50 rounded-xl',
              'pl-11 pr-4 py-4 text-[15px] text-white',
              'placeholder:text-muted-foreground/40',
              'focus:outline-none focus:border-white/30 focus:glow-input',
              'hover:border-border hover:bg-surface-2/30',
              'transition-all duration-300 ease-out',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-1',
            )}
          />
        </div>
        <p className="flex items-start gap-2 text-[11px] text-muted-foreground/40 px-1 leading-relaxed">
          <Sparkles size={11} className="shrink-0 mt-0.5 text-white/30" />
          <span>
            Our AI maps informal names to real course codes.
          </span>
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={cn(
          'mt-2 w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-[15px] font-semibold',
          'bg-white text-black',
          'glow-strong',
          'transition-all duration-200 ease-out',
          'hover:bg-white/90',
          'active:scale-[0.98]',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-white',
          'focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-background',
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
