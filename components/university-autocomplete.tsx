'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { filterUniversities } from '@/lib/universities'
import { cn } from '@/lib/utils'
import { Building2, ChevronDown } from 'lucide-react'

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    const filtered = filterUniversities(newValue)
    setSuggestions(filtered)
    setIsOpen(filtered.length > 0)
    setHighlightedIndex(-1)
  }, [])

  const handleSelect = useCallback(
    (uni: string) => {
      setInputValue(uni)
      onChange(uni)
      setSuggestions([])
      setIsOpen(false)
      setHighlightedIndex(-1)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return
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
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelect],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        setTimeout(() => {
          setIsOpen(false)
          // If the typed value doesn't match a selection, keep it as-is but don't auto-select
          if (inputValue && !suggestions.includes(inputValue)) {
            onChange(inputValue)
          }
        }, 150)
      }
    },
    [inputValue, suggestions, onChange],
  )

  // Highlight matching characters
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <>
        <span className="text-muted-foreground">{text.slice(0, idx)}</span>
        <span className="text-foreground font-medium">{text.slice(idx, idx + query.length)}</span>
        <span className="text-muted-foreground">{text.slice(idx + query.length)}</span>
      </>
    )
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative flex items-center">
        <Building2
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={15}
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
          className={cn(
            'w-full bg-surface-2 border border-border rounded-md',
            'pl-9 pr-9 py-2.5 text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        <ChevronDown
          className={cn(
            'absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-150',
            isOpen && 'rotate-180',
          )}
          size={14}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className={cn(
            'absolute z-50 w-full mt-1',
            'bg-popover border border-border rounded-md',
            'shadow-xl shadow-black/40',
            'overflow-hidden',
          )}
        >
          {suggestions.map((uni, idx) => (
            <li
              key={uni}
              role="option"
              aria-selected={idx === highlightedIndex}
              onMouseDown={() => handleSelect(uni)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm transition-colors duration-75',
                idx === highlightedIndex ? 'bg-surface-3 text-foreground' : 'text-foreground/80',
                idx !== suggestions.length - 1 && 'border-b border-border/50',
              )}
            >
              <Building2 size={13} className="text-muted-foreground shrink-0" />
              <span className="truncate">{highlightMatch(uni, inputValue)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
