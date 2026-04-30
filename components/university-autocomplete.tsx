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
    
    if (merged.length === 0) return <span className="text-foreground/70">{text}</span>
    
    const parts: React.ReactNode[] = []
    let lastEnd = 0
    
    for (let i = 0; i < merged.length; i++) {
      const { start, end } = merged[i]
      if (start > lastEnd) {
        parts.push(
          <span key={`dim-${i}`} className="text-foreground/50">
            {text.slice(lastEnd, start)}
          </span>
        )
      }
      parts.push(
        <span key={`match-${i}`} className="text-white font-medium">
          {text.slice(start, end)}
        </span>
      )
      lastEnd = end
    }
    
    if (lastEnd < text.length) {
      parts.push(
        <span key="dim-end" className="text-foreground/50">
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
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none transition-colors duration-200 group-focus-within:text-white"
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
            'w-full bg-surface-1 border border-border/50 rounded-xl',
            'pl-11 pr-11 py-4 text-[15px] text-white',
            'placeholder:text-muted-foreground/40',
            'focus:outline-none focus:border-white/30 focus:glow-input',
            'hover:border-border hover:bg-surface-2/30',
            'transition-all duration-300 ease-out',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-1',
          )}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="university-listbox"
        />
        <ChevronDown
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none',
            'transition-all duration-300 ease-out',
            isOpen && 'rotate-180 text-white/60',
          )}
          size={16}
        />
      </div>

      {/* Dropdown with smooth animation */}
      <div
        className={cn(
          'absolute z-50 w-full mt-2',
          'transition-all duration-300 ease-out origin-top',
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
            'bg-surface-1/98 backdrop-blur-2xl border border-border/40 rounded-xl',
            'glow',
            'overflow-hidden overflow-y-auto max-h-[380px]',
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
                  'flex items-center gap-4 px-4 py-3.5 cursor-pointer',
                  'transition-all duration-150 ease-out',
                  'border-b border-border/20 last:border-b-0',
                  idx === highlightedIndex 
                    ? 'bg-white/[0.06]' 
                    : 'hover:bg-white/[0.03]',
                )}
              >
                {/* University Logo - using Google favicon service */}
                <div className={cn(
                  'relative w-10 h-10 rounded-lg overflow-hidden shrink-0',
                  'bg-surface-3/60 border border-border/30',
                  'flex items-center justify-center',
                )}>
                  {!hasLogoError ? (
                    <Image
                      src={logoUrl}
                      alt={`${uni.name} logo`}
                      width={40}
                      height={40}
                      className="w-7 h-7 object-contain"
                      onError={() => handleLogoError(uni.domain)}
                      unoptimized
                    />
                  ) : (
                    <Building2 size={18} className="text-muted-foreground/50" />
                  )}
                </div>
                
                {/* University Info */}
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-[14px] leading-snug">
                    {highlightMatch(uni.name, inputValue)}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground/50">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">
                      {uni.city}, {uni.state}
                      {uni.campus && <span className="text-white/40 ml-1">({uni.campus})</span>}
                    </span>
                  </span>
                </div>
                
                {/* Selection indicator */}
                {idx === highlightedIndex && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                )}
              </li>
            )
          })}
        </ul>
        
        {/* Subtle hint */}
        <div className="flex justify-center mt-2">
          <span className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
            {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
