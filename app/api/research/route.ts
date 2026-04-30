import { z } from 'zod'

export const maxDuration = 60

// ============================================================================
// Types
// ============================================================================

const GradeDistributionSchema = z.object({
  A: z.number(),
  B: z.number(),
  C: z.number(),
  D: z.number(),
  F: z.number(),
})

const ReviewTrendSchema = z.object({
  direction: z.enum(['up', 'down', 'stable']),
  description: z.string(),
})

const ReviewSchema = z.object({
  comment: z.string(),
  rating: z.number(),
  difficulty: z.number(),
  date: z.string(),
  class: z.string().nullable(),
  grade: z.string().nullable(),
  wouldTakeAgain: z.boolean().nullable(),
  tags: z.array(z.string()),
  thumbsUp: z.number(),
})

const ResearchResultSchema = z.object({
  courseCode: z.string().nullable(),
  courseFullName: z.string().nullable(),
  professorFound: z.boolean(),
  notFoundReason: z.string().nullable(),
  isMockData: z.boolean().optional(),

  // Professor info
  professorFirstName: z.string().nullable(),
  professorLastName: z.string().nullable(),
  department: z.string().nullable(),
  rmpUrl: z.string().nullable(),

  // Overall professor stats
  overallRating: z.number().nullable(),
  overallRatingCount: z.number().nullable(),
  difficulty: z.number().nullable(),
  wouldTakeAgain: z.number().nullable(),

  // Class-specific stats
  classSpecificRating: z.number().nullable(),
  classSpecificRatingCount: z.number().nullable(),
  classSpecificDifficulty: z.number().nullable(),
  hasClassSpecificData: z.boolean(),

  // Available courses this professor teaches (from real data)
  availableCourses: z.array(z.object({
    courseName: z.string(),
    courseCount: z.number(),
  })).nullable(),

  // Grade distribution
  gradeDistribution: GradeDistributionSchema.nullable(),

  // Review trend
  reviewTrend: ReviewTrendSchema.nullable(),

  // Verdict
  verdict: z.enum(['take', 'avoid', 'mixed']).nullable(),

  // Real reviews
  reviews: z.array(ReviewSchema).nullable(),
  classSpecificReviews: z.array(ReviewSchema).nullable(),

  // Summaries (computed from real data)
  aiSummary: z.string().nullable(),
  classSpecificInsights: z.string().nullable(),
  standoutQuote: z.string().nullable(),

  // Tags & themes
  tags: z.array(z.string()).nullable(),
  pros: z.array(z.string()).nullable(),
  cons: z.array(z.string()).nullable(),

  // Sources
  sources: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['rmp', 'reddit', 'other']),
        reviewCount: z.number(),
        url: z.string().nullable(),
      }),
    )
    .nullable(),
})

export type ResearchResult = z.infer<typeof ResearchResultSchema>

// ============================================================================
// Helper functions
// ============================================================================

function normalizeClassName(input: string): string {
  // Common class name mappings
  const mappings: Record<string, string[]> = {
    'calc': ['MATH', 'Calculus'],
    'calc 1': ['MATH 124', 'MATH 151', 'MATH 141', 'Calculus I'],
    'calc 2': ['MATH 125', 'MATH 152', 'MATH 142', 'Calculus II'],
    'calc 3': ['MATH 126', 'MATH 253', 'MATH 243', 'Calculus III'],
    'intro to psych': ['PSYCH 101', 'PSY 101', 'PSYC 100'],
    'intro to cs': ['CS 101', 'CSE 142', 'COMP 101', 'CIS 110'],
    'data structures': ['CS 201', 'CSE 143', 'COMP 182', 'CIS 121'],
    'algorithms': ['CS 301', 'CSE 332', 'COMP 285'],
    'linear algebra': ['MATH 308', 'MATH 221', 'MATH 200'],
    'organic chem': ['CHEM 237', 'CHEM 241', 'CHEM 301'],
    'physics 1': ['PHYS 121', 'PHYS 141', 'PHYS 101'],
    'physics 2': ['PHYS 122', 'PHYS 142', 'PHYS 102'],
  }

  const lower = input.toLowerCase().trim()
  
  // Check if input matches a mapping
  for (const [key, values] of Object.entries(mappings)) {
    if (lower === key || lower.includes(key)) {
      return values[0] // Return the first (most common) mapping
    }
  }

  // If it already looks like a course code, normalize it
  const codeMatch = input.match(/^([A-Za-z]+)\s*(\d+)/)
  if (codeMatch) {
    return `${codeMatch[1].toUpperCase()} ${codeMatch[2]}`
  }

  return input.toUpperCase()
}

function computeGradeDistribution(ratings: { grade?: string | null }[]): { A: number; B: number; C: number; D: number; F: number } | null {
  const gradeRatings = ratings.filter(r => r.grade && r.grade !== 'N/A' && r.grade !== 'Not sure')
  if (gradeRatings.length === 0) return null

  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  
  for (const r of gradeRatings) {
    const g = r.grade?.toUpperCase() || ''
    if (g.startsWith('A')) counts.A++
    else if (g.startsWith('B')) counts.B++
    else if (g.startsWith('C')) counts.C++
    else if (g.startsWith('D')) counts.D++
    else if (g.startsWith('F') || g === 'INCOMPLETE' || g === 'DROP') counts.F++
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return {
    A: Math.round((counts.A / total) * 100),
    B: Math.round((counts.B / total) * 100),
    C: Math.round((counts.C / total) * 100),
    D: Math.round((counts.D / total) * 100),
    F: Math.round((counts.F / total) * 100),
  }
}

function computeReviewTrend(ratings: { date?: string; quality?: number }[]): { direction: 'up' | 'down' | 'stable'; description: string } | null {
  const datedRatings = ratings
    .filter(r => r.date && r.quality)
    .map(r => ({ date: new Date(r.date!), quality: r.quality! }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (datedRatings.length < 3) return null

  // Compare first third vs last third
  const third = Math.floor(datedRatings.length / 3)
  const early = datedRatings.slice(0, third)
  const recent = datedRatings.slice(-third)

  const earlyAvg = early.reduce((sum, r) => sum + r.quality, 0) / early.length
  const recentAvg = recent.reduce((sum, r) => sum + r.quality, 0) / recent.length

  const diff = recentAvg - earlyAvg

  if (diff > 0.3) {
    return { direction: 'up', description: 'Ratings have been improving recently' }
  } else if (diff < -0.3) {
    return { direction: 'down', description: 'Ratings have been declining recently' }
  }
  return { direction: 'stable', description: 'Ratings have been consistent over time' }
}

function generateSummary(ratings: { comment?: string; quality?: number; wouldTakeAgain?: number | null }[], professorName: string): string {
  if (ratings.length === 0) return 'No reviews available to summarize.'

  const avgQuality = ratings.reduce((sum, r) => sum + (r.quality || 0), 0) / ratings.length
  const wouldTakeAgainRatings = ratings.filter(r => r.wouldTakeAgain !== null && r.wouldTakeAgain !== undefined)
  const wouldTakeAgainPct = wouldTakeAgainRatings.length > 0
    ? (wouldTakeAgainRatings.filter(r => r.wouldTakeAgain === 1).length / wouldTakeAgainRatings.length) * 100
    : null

  // Extract common themes from comments
  const comments = ratings.map(r => r.comment || '').join(' ').toLowerCase()
  
  const themes: string[] = []
  if (comments.includes('helpful') || comments.includes('help')) themes.push('helpful')
  if (comments.includes('clear') || comments.includes('explains well')) themes.push('clear explanations')
  if (comments.includes('hard') || comments.includes('difficult') || comments.includes('tough')) themes.push('challenging')
  if (comments.includes('easy') || comments.includes('simple')) themes.push('straightforward')
  if (comments.includes('boring') || comments.includes('dull')) themes.push('lectures can be dry')
  if (comments.includes('engaging') || comments.includes('interesting')) themes.push('engaging')
  if (comments.includes('fair') || comments.includes('reasonable')) themes.push('fair grading')
  if (comments.includes('harsh') || comments.includes('strict')) themes.push('strict grading')
  if (comments.includes('caring') || comments.includes('cares')) themes.push('cares about students')

  let summary = `Based on ${ratings.length} reviews, `
  
  if (avgQuality >= 4.0) {
    summary += `${professorName} is highly rated by students. `
  } else if (avgQuality >= 3.0) {
    summary += `${professorName} receives mixed but generally positive reviews. `
  } else {
    summary += `${professorName} has received some critical feedback. `
  }

  if (themes.length > 0) {
    summary += `Students commonly mention: ${themes.slice(0, 3).join(', ')}. `
  }

  if (wouldTakeAgainPct !== null) {
    if (wouldTakeAgainPct >= 70) {
      summary += `A strong majority (${Math.round(wouldTakeAgainPct)}%) would take this professor again.`
    } else if (wouldTakeAgainPct >= 50) {
      summary += `About ${Math.round(wouldTakeAgainPct)}% would take this professor again.`
    } else {
      summary += `Only ${Math.round(wouldTakeAgainPct)}% would take this professor again.`
    }
  }

  return summary
}

function extractProsAndCons(ratings: { comment?: string; quality?: number }[]): { pros: string[]; cons: string[] } {
  const pros: string[] = []
  const cons: string[] = []

  const positiveKeywords = ['helpful', 'clear', 'engaging', 'fair', 'caring', 'organized', 'knowledgeable', 'passionate', 'accessible', 'responsive']
  const negativeKeywords = ['boring', 'confusing', 'harsh', 'disorganized', 'unclear', 'unresponsive', 'difficult', 'unfair', 'rude']

  const comments = ratings.map(r => r.comment?.toLowerCase() || '').join(' ')

  for (const word of positiveKeywords) {
    if (comments.includes(word)) {
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1)
      if (!pros.includes(capitalized)) pros.push(capitalized)
    }
  }

  for (const word of negativeKeywords) {
    if (comments.includes(word)) {
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1)
      if (!cons.includes(capitalized)) cons.push(capitalized)
    }
  }

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 4) }
}

// ============================================================================
// Main handler
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { university, professor, className } = body

    if (!university || !professor) {
      return Response.json(
        { error: 'University and professor name are required' },
        { status: 400 }
      )
    }

    // Normalize the class name if provided
    const normalizedClass = className ? normalizeClassName(className) : null

    // Call our internal professor API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const params = new URLSearchParams({
      name: professor,
      school: university,
    })

    const profResponse = await fetch(`${baseUrl}/api/professor?${params}`)
    const profData = await profResponse.json()

    if (!profData.found) {
      return Response.json({
        professorFound: false,
        notFoundReason: profData.error || `Professor "${professor}" not found on Rate My Professors at ${university}`,
        hasClassSpecificData: false,
        availableCourses: null,
        suggestions: profData.suggestions || null,
      } as Partial<ResearchResult>)
    }

    const { professor: prof, ratings, availableClasses } = profData

    // Filter ratings by class if specified
    let classSpecificRatings: typeof ratings = []
    if (normalizedClass && ratings.length > 0) {
      const classVariants = [
        normalizedClass.toUpperCase(),
        normalizedClass.replace(/\s+/g, ''),
        normalizedClass.replace(/\s+/g, ' '),
      ]
      
      classSpecificRatings = ratings.filter((r: { class?: string }) => {
        if (!r.class) return false
        const rClass = r.class.toUpperCase().trim()
        return classVariants.some(v => rClass.includes(v) || v.includes(rClass))
      })
    }

    // Compute class-specific stats
    const hasClassSpecificData = classSpecificRatings.length > 0
    let classSpecificRating = null
    let classSpecificDifficulty = null

    if (hasClassSpecificData) {
      const qualityRatings = classSpecificRatings.filter((r: { quality?: number }) => r.quality)
      const difficultyRatings = classSpecificRatings.filter((r: { difficulty?: number }) => r.difficulty)
      
      if (qualityRatings.length > 0) {
        classSpecificRating = qualityRatings.reduce((sum: number, r: { quality: number }) => sum + r.quality, 0) / qualityRatings.length
      }
      if (difficultyRatings.length > 0) {
        classSpecificDifficulty = difficultyRatings.reduce((sum: number, r: { difficulty: number }) => sum + r.difficulty, 0) / difficultyRatings.length
      }
    }

    // Compute grade distribution from all ratings (or class-specific if available)
    const ratingsForGrades = hasClassSpecificData ? classSpecificRatings : ratings
    const gradeDistribution = computeGradeDistribution(ratingsForGrades)

    // Compute review trend
    const reviewTrend = computeReviewTrend(ratings)

    // Determine verdict
    let verdict: 'take' | 'avoid' | 'mixed' | null = null
    const ratingToUse = hasClassSpecificData ? classSpecificRating : prof.avgRating
    if (ratingToUse !== null) {
      if (ratingToUse >= 3.8) verdict = 'take'
      else if (ratingToUse < 2.5) verdict = 'avoid'
      else verdict = 'mixed'
    }

    // Generate AI summary
    const summaryRatings = hasClassSpecificData ? classSpecificRatings : ratings.slice(0, 20)
    const aiSummary = generateSummary(summaryRatings, `${prof.firstName} ${prof.lastName}`)

    // Extract pros and cons
    const { pros, cons } = extractProsAndCons(ratings)

    // Find standout quote
    const sortedByUpvotes = [...ratings].sort((a: { thumbsUp: number }, b: { thumbsUp: number }) => b.thumbsUp - a.thumbsUp)
    const standoutQuote = sortedByUpvotes[0]?.comment?.substring(0, 200) || null

    // Format reviews for response
    const formatReview = (r: {
      comment?: string
      quality?: number
      difficulty?: number
      date?: string
      class?: string
      grade?: string
      wouldTakeAgain?: number | null
      tags?: string[]
      thumbsUp?: number
    }) => ({
      comment: r.comment || '',
      rating: r.quality || 0,
      difficulty: r.difficulty || 0,
      date: r.date || '',
      class: r.class || null,
      grade: r.grade || null,
      wouldTakeAgain: r.wouldTakeAgain === 1 ? true : r.wouldTakeAgain === 0 ? false : null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      thumbsUp: r.thumbsUp || 0,
    })

    const result: ResearchResult = {
      courseCode: normalizedClass,
      courseFullName: normalizedClass,
      professorFound: true,
      notFoundReason: null,
      isMockData: profData.isMockData || false,

      professorFirstName: prof.firstName,
      professorLastName: prof.lastName,
      department: prof.department,
      rmpUrl: `https://www.ratemyprofessors.com/professor/${prof.legacyId}`,

      overallRating: prof.avgRating,
      overallRatingCount: prof.numRatings,
      difficulty: prof.avgDifficulty,
      wouldTakeAgain: prof.wouldTakeAgainPercent > 0 ? prof.wouldTakeAgainPercent : null,

      classSpecificRating: classSpecificRating ? Math.round(classSpecificRating * 10) / 10 : null,
      classSpecificRatingCount: classSpecificRatings.length,
      classSpecificDifficulty: classSpecificDifficulty ? Math.round(classSpecificDifficulty * 10) / 10 : null,
      hasClassSpecificData,

      availableCourses: availableClasses?.map((c: { name: string; count: number }) => ({
        courseName: c.name,
        courseCount: c.count,
      })) || null,

      gradeDistribution,
      reviewTrend,
      verdict,

      reviews: ratings.slice(0, 15).map(formatReview),
      classSpecificReviews: hasClassSpecificData 
        ? classSpecificRatings.slice(0, 10).map(formatReview)
        : null,

      aiSummary,
      classSpecificInsights: hasClassSpecificData
        ? `Found ${classSpecificRatings.length} reviews specifically for ${normalizedClass}.`
        : normalizedClass
          ? `No reviews found specifically for ${normalizedClass}. Showing overall professor ratings instead.`
          : null,
      standoutQuote,

      tags: prof.tags || [],
      pros,
      cons,

      sources: [
        {
          name: 'Rate My Professors',
          type: 'rmp',
          reviewCount: prof.numRatings,
          url: `https://www.ratemyprofessors.com/professor/${prof.legacyId}`,
        },
      ],
    }

    return Response.json(result)

  } catch (error) {
    console.error('[v0] Research API error:', error)
    return Response.json(
      { 
        professorFound: false, 
        notFoundReason: 'An error occurred while fetching professor data. Please try again.',
        hasClassSpecificData: false,
      },
      { status: 500 }
    )
  }
}
