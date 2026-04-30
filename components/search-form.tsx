'use client'

import { useState, useCallback } from 'react'
import { UniversityAutocomplete } from '@/components/university-autocomplete'
import { cn } from '@/lib/utils'
import { BookOpen, Search, User, Loader2 } from 'lucide-react'

interface SearchFormProps {
  onSearch: (query: { university: string; professor: string; classQuery: string }) => void
  isLoading: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [university, setUniversity] = useState('')
  const [professor, setProfessor] = useState('')
  const [classQuery, setClassQuery] = useState('')

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* University */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
          University
        </label>
        <UniversityAutocomplete
          value={university}
          onChange={setUniversity}
          placeholder="e.g. University of Washington"
          disabled={isLoading}
        />
      </div>

      {/* Professor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
          Professor
        </label>
        <div className="relative flex items-center">
          <User
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={15}
          />
          <input
            type="text"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            placeholder="e.g. Dr. Sarah Chen"
            disabled={isLoading}
            className={cn(
              'w-full bg-surface-2 border border-border rounded-md',
              'pl-9 pr-4 py-2.5 text-sm text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          />
        </div>
      </div>

      {/* Class */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5">
          Class{' '}
          <span className="normal-case text-muted-foreground/60 font-normal tracking-normal">
            (optional — use natural language)
          </span>
        </label>
        <div className="relative flex items-center">
          <BookOpen
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={15}
          />
          <input
            type="text"
            value={classQuery}
            onChange={(e) => setClassQuery(e.target.value)}
            placeholder="e.g. calc 3, intro to psych, data structures"
            disabled={isLoading}
            className={cn(
              'w-full bg-surface-2 border border-border rounded-md',
              'pl-9 pr-4 py-2.5 text-sm text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/60 px-0.5 leading-relaxed">
          The agent maps informal names to real course codes and finds class-specific reviews.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={cn(
          'mt-1 w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-md text-sm font-medium',
          'bg-accent text-accent-foreground',
          'transition-all duration-150',
          'hover:opacity-90 active:scale-[0.99]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background',
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Researching...
          </>
        ) : (
          <>
            <Search size={15} />
            Research Professor
          </>
        )}
      </button>
    </form>
  )
}
