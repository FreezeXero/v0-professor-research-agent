'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const steps = [
  { label: 'Mapping course code', duration: 800 },
  { label: 'Searching Rate My Professor', duration: 1200 },
  { label: 'Scanning Reddit threads', duration: 1000 },
  { label: 'Filtering class-specific reviews', duration: 900 },
  { label: 'Analyzing sentiment patterns', duration: 1100 },
  { label: 'Generating summary', duration: 800 },
]

export function AgentStatus({ isLoading }: { isLoading: boolean }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0)
      setCompletedSteps([])
      return
    }

    let stepIndex = 0
    const intervals: NodeJS.Timeout[] = []

    const advance = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex)
        const s = stepIndex
        const timeout = setTimeout(() => {
          setCompletedSteps((prev) => [...prev, s])
          stepIndex++
          if (stepIndex < steps.length) advance()
        }, steps[s].duration)
        intervals.push(timeout)
      }
    }

    advance()
    return () => intervals.forEach(clearTimeout)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="flex flex-col gap-2 py-2">
      {steps.map((step, i) => {
        const isDone = completedSteps.includes(i)
        const isActive = currentStep === i && !isDone
        const isPending = i > currentStep

        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 flex items-center justify-center shrink-0">
              {isDone ? (
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              ) : isActive ? (
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-border" />
              )}
            </div>
            <span
              className={cn(
                'text-xs leading-relaxed transition-colors duration-300',
                isDone ? 'text-muted-foreground/50 line-through' : '',
                isActive ? 'text-foreground' : '',
                isPending ? 'text-muted-foreground/30' : '',
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
