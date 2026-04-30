'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { filterUniversities, expandAbbreviation, getUniversityLogoUrl, type University } from '@/lib/universities'
import { cn } from '@/lib/utils'
import { Building2, ChevronDown, MapPin } from 'lucide-react'
import Image from 'next/image'

interface UniversityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function UniversityAutocomplete({
  value,
  onChange,
  placeholder = 'Search universities...',
  disabled = false,
}: UniversityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<University[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedIndex])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Check for abbreviation expansion first
    const expanded = expandAbbreviation(newValue)
    if (expanded) {
      const expandedUni = filterUniversities(expanded)
      if (expandedUni.length > 0) {
        setSuggestions(expandedUni)
        setIsOpen(true)
        setHighlightedIndex(0)
        return
      }
    }
    
    const filtered = filterUniversities(newValue)
    setSuggestions(filtered)
    setIsOpen(filtered.length > 0)
    setHighlightedIndex(filtered.length > 0 ? 0 : -1)
  }, [])

  const handleSelect = useCallback(
    (uni: University) => {
      setInputValue(uni.name)
      onChange(uni.name)
      setSuggestions([])
      setIsOpen(false)
      setHighlightedIndex(-1)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' && inputValue.length >= 2) {
          const filtered = filterUniversities(inputValue)
          if (filtered.length > 0) {
            setSuggestions(filtered)
            setIsOpen(true)
            setHighlightedIndex(0)
          }
        }
        return
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        handleSelect(suggestions[highlightedIndex])
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setHighlightedIndex(-1)
      } else if (e.key === 'Tab' && highlightedIndex >= 0) {
        handleSelect(suggestions[highlightedIndex])
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelect, inputValue],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        setTimeout(() => {
          setIsOpen(false)
          if (inputValue && suggestions.length === 0) {
            onChange(inputValue)
          }
        }, 150)
      }
    },
    [inputValue, suggestions, onChange],
  )

  const handleLogoError = useCallback((domain: string) => {
    setLogoErrors(prev => new Set(prev).add(domain))
  }, [])

  // Highlight matching characters
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>
    
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    const lowerText = text.toLowerCase()
    
    // Find all matching ranges
    const ranges: Array<{ start: number; end: number }> = []
    
    for (const word of words) {
      let idx = lowerText.indexOf(word)
      while (idx !== -1) {
        ranges.push({ start: idx, end: idx + word.length })
        idx = lowerText.indexOf(word, idx + 1)
      }
    }
    
    // Merge overlapping ranges
    ranges.sort((a, b) => a.start - b.start)
    const merged: Array<{ start: number; end: number }> = []
    for (const range of ranges) {
      if (merged.length === 0 || merged[merged.length - 1].end < range.start) {
        merged.push({ ...range })
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, range.end)
      }
    }
    
    if (merged.length === 0) return <span className="text-foreground/80">{text}</span>
    
    const parts: React.ReactNode[] = []
    let lastEnd = 0
    
    for (let i = 0; i < merged.length; i++) {
      const { start, end } = merged[i]
      if (start > lastEnd) {
        parts.push(
          <span key={`dim-${i}`} className="text-foreground/60">
            {text.slice(lastEnd, start)}
          </span>
        )
      }
      parts.push(
        <span key={`match-${i}`} className="text-foreground font-medium">
          {text.slice(start, end)}
        </span>
      )
      lastEnd = end
    }
    
    if (lastEnd < text.length) {
      parts.push(
        <span key="dim-end" className="text-foreground/60">
          {text.slice(lastEnd)}
        </span>
      )
    }
    
    return <>{parts}</>
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative flex items-center group">
        <Building2
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none transition-colors group-focus-within:text-accent"
          size={16}
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'w-full bg-surface-1 border border-border/60 rounded-xl',
            'pl-11 pr-11 py-3.5 text-[15px] text-foreground',
            'placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60',
            'hover:border-border hover:bg-surface-2/50',
            'transition-all duration-200 ease-out',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-1',
          )}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="university-listbox"
        />
        <ChevronDown
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none',
            'transition-all duration-200 ease-out',
            isOpen && 'rotate-180 text-accent/70',
          )}
          size={16}
        />
      </div>

      {/* Dropdown with smooth animation */}
      <div
        className={cn(
          'absolute z-50 w-full mt-2',
          'transition-all duration-200 ease-out origin-top',
          isOpen && suggestions.length > 0
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none',
        )}
      >
        <ul
          ref={listRef}
          id="university-listbox"
          role="listbox"
          className={cn(
            'bg-surface-1/95 backdrop-blur-xl border border-border/50 rounded-xl',
            'shadow-2xl shadow-black/40',
            'overflow-hidden overflow-y-auto max-h-[340px]',
            'divide-y divide-border/30',
          )}
        >
          {suggestions.map((uni, idx) => {
            const logoUrl = getUniversityLogoUrl(uni.domain)
            const hasLogoError = logoErrors.has(uni.domain)
            
            return (
              <li
                key={`${uni.name}-${uni.campus || 'main'}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                onMouseDown={() => handleSelect(uni)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 cursor-pointer',
                  'transition-all duration-100 ease-out',
                  idx === highlightedIndex 
                    ? 'bg-accent/10' 
                    : 'hover:bg-surface-2/60',
                )}
              >
                {/* University Logo */}
                <div className={cn(
                  'relative w-9 h-9 rounded-lg overflow-hidden shrink-0',
                  'bg-surface-3/80 border border-border/40',
                  'flex items-center justify-center',
                )}>
                  {!hasLogoError ? (
                    <Image
                      src={logoUrl}
                      alt={`${uni.name} logo`}
                      width={36}
                      height={36}
                      className="w-full h-full object-contain p-1.5"
                      onError={() => handleLogoError(uni.domain)}
                      unoptimized
                    />
                  ) : (
                    <Building2 size={16} className="text-muted-foreground/60" />
                  )}
                </div>
                
                {/* University Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-[14px] leading-snug">
                    {highlightMatch(uni.name, inputValue)}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 mt-0.5">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">
                      {uni.city}, {uni.state}
                      {uni.campus && <span className="text-accent/70"> • {uni.campus} Campus</span>}
                    </span>
                  </span>
                </div>
                
                {/* Selection indicator */}
                {idx === highlightedIndex && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
              </li>
            )
          })}
        </ul>
        
        {/* Subtle hint */}
        <div className="flex justify-center mt-2">
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">
            {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} • Use ↑↓ to navigate
          </span>
        </div>
      </div>
    </div>
  )
}
