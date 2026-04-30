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
export type Review = z.infer<typeof ReviewSchema>

// ============================================================================
// RMP GraphQL API
// ============================================================================

const RMP_ENDPOINT = 'https://www.ratemyprofessors.com/graphql'
const RMP_AUTH = 'dGVzdDp0ZXN0' // Base64 encoded test:test

async function rmpQuery(query: string, variables: Record<string, unknown>) {
  try {
    const response = await fetch(RMP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${RMP_AUTH}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.ratemyprofessors.com',
        'Referer': 'https://www.ratemyprofessors.com/',
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      console.error(`[v0] RMP API error: ${response.status} ${response.statusText}`)
      const text = await response.text()
      console.error(`[v0] Response body: ${text.substring(0, 500)}`)
      throw new Error(`RMP API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Check for GraphQL errors
    if (data.errors && data.errors.length > 0) {
      console.error('[v0] GraphQL errors:', JSON.stringify(data.errors))
    }
    
    return data
  } catch (error) {
    console.error('[v0] RMP fetch error:', error)
    throw error
  }
}

// Search for school by name
async function searchSchool(schoolName: string): Promise<{ id: string; legacyId: number; name: string } | null> {
  const query = `
    query NewSearchSchoolsQuery($query: SchoolSearchQuery!) {
      newSearch {
        schools(query: $query) {
          edges {
            node {
              id
              legacyId
              name
              city
              state
            }
          }
        }
      }
    }
  `

  const result = await rmpQuery(query, { query: { text: schoolName } })
  const schools = result?.data?.newSearch?.schools?.edges || []
  
  if (schools.length === 0) return null

  // Try to find exact match first
  const normalizedSearch = schoolName.toLowerCase().trim()
  const exactMatch = schools.find((edge: { node: { name: string } }) => 
    edge.node.name.toLowerCase() === normalizedSearch
  )
  
  return exactMatch?.node || schools[0]?.node || null
}

// Search for professor at school
async function searchProfessor(professorName: string, schoolId: string): Promise<{ id: string; legacyId: number; firstName: string; lastName: string; department: string } | null> {
  const query = `
    query NewSearchTeachersQuery($query: TeacherSearchQuery!) {
      newSearch {
        teachers(query: $query) {
          edges {
            node {
              id
              legacyId
              firstName
              lastName
              department
              school {
                name
                id
              }
            }
          }
        }
      }
    }
  `

  const result = await rmpQuery(query, { 
    query: { 
      text: professorName,
      schoolID: schoolId,
    } 
  })
  
  const teachers = result?.data?.newSearch?.teachers?.edges || []
  if (teachers.length === 0) return null

  // Parse the search query into first and last name parts
  const normalizedSearch = professorName.toLowerCase().trim()
  const nameParts = normalizedSearch.split(/\s+/).filter(p => p.length > 0)
  
  // Try to find an exact match (both first AND last name must match)
  for (const edge of teachers) {
    const { firstName, lastName } = edge.node as { firstName: string; lastName: string }
    const firstLower = firstName.toLowerCase()
    const lastLower = lastName.toLowerCase()
    const fullName = `${firstLower} ${lastLower}`
    
    // Exact full name match
    if (fullName === normalizedSearch) {
      return edge.node
    }
    
    // All name parts must be present in either first or last name
    if (nameParts.length >= 2) {
      // Check if we have a first name match AND last name match
      const hasFirstMatch = nameParts.some(part => firstLower.includes(part) || part.includes(firstLower))
      const hasLastMatch = nameParts.some(part => lastLower.includes(part) || part.includes(lastLower))
      
      // Both first and last name must have a match from different parts
      if (hasFirstMatch && hasLastMatch) {
        // Verify this is the right person by checking that the parts actually match
        const matchesFirst = nameParts.some(part => 
          firstLower === part || firstLower.startsWith(part) || part.startsWith(firstLower)
        )
        const matchesLast = nameParts.some(part => 
          lastLower === part || lastLower.startsWith(part) || part.startsWith(lastLower)
        )
        if (matchesFirst && matchesLast) {
          return edge.node
        }
      }
    }
    
    // Single name search - must match last name exactly
    if (nameParts.length === 1) {
      if (lastLower === nameParts[0] || lastLower.startsWith(nameParts[0])) {
        return edge.node
      }
    }
  }

  // No exact match found - return null instead of a random professor
  return null
}

// Get full professor details including ratings
async function getProfessorDetails(professorId: string) {
  const query = `
    query TeacherRatingsPageQuery($id: ID!) {
      node(id: $id) {
        __typename
        ... on Teacher {
          id
          legacyId
          firstName
          lastName
          department
          school {
            legacyId
            name
            id
          }
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
          courseCodes {
            courseName
            courseCount
          }
          ratingsDistribution {
            r1
            r2
            r3
            r4
            r5
          }
          ratings(first: 50) {
            edges {
              node {
                id
                legacyId
                comment
                date
                class
                grade
                helpfulRating
                clarityRating
                difficultyRating
                wouldTakeAgain
                ratingTags
                thumbsUpTotal
                thumbsDownTotal
                isForOnlineClass
                attendanceMandatory
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `

  const result = await rmpQuery(query, { id: professorId })
  return result?.data?.node || null
}

// ============================================================================
// Data Processing
// ============================================================================

function normalizeClassName(className: string | null | undefined): string {
  if (!className) return ''
  // Remove common patterns and normalize
  return className
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/[^A-Z0-9]/g, '')
}

function classNamesMatch(class1: string | null | undefined, class2: string | null | undefined): boolean {
  const norm1 = normalizeClassName(class1)
  const norm2 = normalizeClassName(class2)
  
  if (!norm1 || !norm2) return false
  
  // Direct match
  if (norm1 === norm2) return true
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true
  
  // Extract just the numbers and letters separately
  const letters1 = norm1.replace(/[0-9]/g, '')
  const numbers1 = norm1.replace(/[A-Z]/g, '')
  const letters2 = norm2.replace(/[0-9]/g, '')
  const numbers2 = norm2.replace(/[A-Z]/g, '')
  
  // Match if same department prefix and same number
  if (letters1 === letters2 && numbers1 === numbers2) return true
  
  return false
}

interface RawRating {
  comment: string
  date: string
  class: string | null
  grade: string | null
  helpfulRating: number
  clarityRating: number
  difficultyRating: number
  wouldTakeAgain: number | null
  ratingTags: string[]
  thumbsUpTotal: number
}

function processReviews(rawRatings: RawRating[]): Review[] {
  return rawRatings.map(r => ({
    comment: r.comment || '',
    rating: ((r.helpfulRating || 0) + (r.clarityRating || 0)) / 2,
    difficulty: r.difficultyRating || 0,
    date: r.date || '',
    class: r.class,
    grade: r.grade,
    wouldTakeAgain: r.wouldTakeAgain === 1 ? true : r.wouldTakeAgain === 0 ? false : null,
    tags: r.ratingTags || [],
    thumbsUp: r.thumbsUpTotal || 0,
  }))
}

function computeGradeDistribution(reviews: Review[]): { A: number; B: number; C: number; D: number; F: number } | null {
  const gradesWithData = reviews.filter(r => r.grade && r.grade !== 'N/A' && r.grade !== 'Not sure yet')
  if (gradesWithData.length < 3) return null

  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  
  for (const r of gradesWithData) {
    const grade = r.grade?.toUpperCase() || ''
    if (grade.startsWith('A')) counts.A++
    else if (grade.startsWith('B')) counts.B++
    else if (grade.startsWith('C')) counts.C++
    else if (grade.startsWith('D')) counts.D++
    else if (grade.startsWith('F') || grade === 'WF') counts.F++
  }

  const total = counts.A + counts.B + counts.C + counts.D + counts.F
  if (total === 0) return null

  return {
    A: Math.round((counts.A / total) * 100),
    B: Math.round((counts.B / total) * 100),
    C: Math.round((counts.C / total) * 100),
    D: Math.round((counts.D / total) * 100),
    F: Math.round((counts.F / total) * 100),
  }
}

function computeTrend(reviews: Review[]): { direction: 'up' | 'down' | 'stable'; description: string } {
  if (reviews.length < 5) {
    return { direction: 'stable', description: 'Not enough reviews to determine trend' }
  }

  // Sort by date (newest first)
  const sorted = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const recentCount = Math.min(10, Math.floor(sorted.length / 3))
  const recent = sorted.slice(0, recentCount)
  const older = sorted.slice(recentCount)

  if (older.length === 0) {
    return { direction: 'stable', description: 'All reviews are recent' }
  }

  const recentAvg = recent.reduce((sum, r) => sum + r.rating, 0) / recent.length
  const olderAvg = older.reduce((sum, r) => sum + r.rating, 0) / older.length
  
  const diff = recentAvg - olderAvg
  
  if (diff > 0.3) {
    return { direction: 'up', description: 'Recent reviews are more positive than older ones' }
  } else if (diff < -0.3) {
    return { direction: 'down', description: 'Recent reviews show a decline compared to earlier feedback' }
  }
  return { direction: 'stable', description: 'Consistent ratings across recent and older reviews' }
}

function extractTopTags(reviews: Review[]): string[] {
  const tagCounts: Record<string, number> = {}
  
  for (const r of reviews) {
    for (const tag of r.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag)
}

function computeProsAndCons(reviews: Review[]): { pros: string[]; cons: string[] } {
  const positiveReviews = reviews.filter(r => r.rating >= 4)
  const negativeReviews = reviews.filter(r => r.rating <= 2.5)

  // Extract common themes from comments
  const pros: string[] = []
  const cons: string[] = []

  // Common positive keywords
  const positiveKeywords = [
    { pattern: /clear|clearly|easy to understand/i, text: 'Explains concepts clearly' },
    { pattern: /helpful|approachable|accessible/i, text: 'Helpful and approachable' },
    { pattern: /fair|reasonable/i, text: 'Fair grader' },
    { pattern: /engaging|interesting|passionate/i, text: 'Engaging lectures' },
    { pattern: /office hours/i, text: 'Good office hours' },
    { pattern: /caring|cares/i, text: 'Cares about students' },
    { pattern: /funny|humor/i, text: 'Good sense of humor' },
    { pattern: /organized/i, text: 'Well organized' },
  ]

  const negativeKeywords = [
    { pattern: /boring|dry|monotone/i, text: 'Lectures can be dry' },
    { pattern: /confusing|unclear|hard to follow/i, text: 'Can be confusing' },
    { pattern: /hard|difficult|tough/i, text: 'Difficult material' },
    { pattern: /fast|rushed|too quick/i, text: 'Moves too fast' },
    { pattern: /homework|workload/i, text: 'Heavy workload' },
    { pattern: /harsh|strict|hard grader/i, text: 'Strict grading' },
    { pattern: /unhelpful|unavailable/i, text: 'Not very available' },
    { pattern: /accent|understand/i, text: 'Can be hard to understand' },
  ]

  for (const kw of positiveKeywords) {
    if (positiveReviews.some(r => kw.pattern.test(r.comment))) {
      pros.push(kw.text)
    }
  }

  for (const kw of negativeKeywords) {
    if (negativeReviews.some(r => kw.pattern.test(r.comment))) {
      cons.push(kw.text)
    }
  }

  return { 
    pros: pros.slice(0, 4), 
    cons: cons.slice(0, 4) 
  }
}

function findStandoutQuote(reviews: Review[]): string | null {
  // Find a highly-upvoted review with a meaningful comment
  const goodReviews = reviews
    .filter(r => r.comment && r.comment.length > 30 && r.comment.length < 300)
    .sort((a, b) => (b.thumbsUp - a.thumbsUp) || (b.rating - a.rating))

  return goodReviews[0]?.comment || null
}

function generateSummary(
  professorName: string,
  courseName: string | null,
  avgRating: number,
  wouldTakeAgain: number | null,
  reviews: Review[],
  hasClassSpecific: boolean,
): string {
  const ratingDesc = avgRating >= 4.0 ? 'highly rated' : avgRating >= 3.0 ? 'moderately rated' : 'has mixed reviews'
  const takeAgainStr = wouldTakeAgain !== null ? `${Math.round(wouldTakeAgain)}% of students would take this professor again.` : ''
  
  // Extract common themes
  const themes: string[] = []
  const positiveCount = reviews.filter(r => r.rating >= 4).length
  const negativeCount = reviews.filter(r => r.rating <= 2).length
  
  if (positiveCount > negativeCount * 2) {
    themes.push('generally positive feedback')
  } else if (negativeCount > positiveCount * 2) {
    themes.push('mixed to negative feedback')
  } else {
    themes.push('divided opinions among students')
  }

  // Check for common comment themes
  const allComments = reviews.map(r => r.comment.toLowerCase()).join(' ')
  if (allComments.includes('lecture') && (allComments.includes('clear') || allComments.includes('good'))) {
    themes.push('known for clear lectures')
  }
  if (allComments.includes('hard') || allComments.includes('difficult')) {
    themes.push('considered challenging')
  }
  if (allComments.includes('helpful') || allComments.includes('office hours')) {
    themes.push('accessible outside of class')
  }

  const themeSummary = themes.length > 0 ? ` Students report ${themes.slice(0, 2).join(' and ')}.` : ''

  return `Professor ${professorName} is ${ratingDesc}${courseName && hasClassSpecific ? ` for ${courseName}` : ''}.${themeSummary} ${takeAgainStr}`.trim()
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(req: Request) {
  try {
    const { university, professor, classQuery } = await req.json()

    if (!university || !professor) {
      return Response.json({ error: 'University and professor name are required.' }, { status: 400 })
    }

    // Step 1: Search for school
    const school = await searchSchool(university)
    if (!school) {
      return Response.json({
        professorFound: false,
        notFoundReason: `Could not find "${university}" in Rate My Professors database. Try the full official name of the school.`,
        hasClassSpecificData: false,
        availableCourses: null,
      } as Partial<ResearchResult>)
    }

    // Step 2: Search for professor at school
    const prof = await searchProfessor(professor, school.id)
    if (!prof) {
      return Response.json({
        professorFound: false,
        notFoundReason: `Professor "${professor}" not found on Rate My Professors at ${school.name}. This professor may not have any ratings yet, or the name spelling might be different. Try the exact name as it appears on RMP.`,
        hasClassSpecificData: false,
        availableCourses: null,
      } as Partial<ResearchResult>)
    }

    // Step 3: Get full professor details
    const details = await getProfessorDetails(prof.id)
    if (!details) {
      return Response.json({
        professorFound: false,
        notFoundReason: `Found professor but could not load their profile. Try again later.`,
        hasClassSpecificData: false,
        availableCourses: null,
      } as Partial<ResearchResult>)
    }

    // Process ratings
    const rawRatings = details.ratings?.edges?.map((e: { node: RawRating }) => e.node) || []
    const allReviews = processReviews(rawRatings)

    // Available courses from RMP
    const availableCourses: { courseName: string; courseCount: number }[] = details.courseCodes || []

    // Filter for class-specific reviews if a class was queried
    let classSpecificReviews: Review[] = []
    let matchedCourse: { courseName: string; courseCount: number } | null = null
    let hasClassSpecificData = false

    if (classQuery) {
      // First check if the queried class exists in available courses
      matchedCourse = availableCourses.find(c => 
        classNamesMatch(c.courseName, classQuery)
      ) || null

      // Filter reviews for this class
      classSpecificReviews = allReviews.filter(r => 
        r.class && classNamesMatch(r.class, classQuery)
      )

      hasClassSpecificData = classSpecificReviews.length > 0
    }

    // Compute stats for class-specific reviews
    const classSpecificRating = hasClassSpecificData 
      ? classSpecificReviews.reduce((sum, r) => sum + r.rating, 0) / classSpecificReviews.length
      : null
    const classSpecificDifficulty = hasClassSpecificData
      ? classSpecificReviews.reduce((sum, r) => sum + r.difficulty, 0) / classSpecificReviews.length
      : null

    // Compute verdict
    const effectiveRating = hasClassSpecificData ? classSpecificRating! : details.avgRating
    const effectiveWTA = hasClassSpecificData 
      ? (classSpecificReviews.filter(r => r.wouldTakeAgain === true).length / classSpecificReviews.filter(r => r.wouldTakeAgain !== null).length) * 100
      : details.wouldTakeAgainPercent
    
    let verdict: 'take' | 'avoid' | 'mixed' = 'mixed'
    if (effectiveRating !== null && effectiveWTA !== null && !isNaN(effectiveWTA)) {
      const score = (effectiveRating * 0.6) + (effectiveWTA / 20 * 0.4)
      verdict = score >= 4.0 ? 'take' : score < 3.0 ? 'avoid' : 'mixed'
    } else if (effectiveRating !== null) {
      verdict = effectiveRating >= 4.0 ? 'take' : effectiveRating < 3.0 ? 'avoid' : 'mixed'
    }

    // Build the response
    const reviewsForAnalysis = hasClassSpecificData ? classSpecificReviews : allReviews
    const gradeDistribution = computeGradeDistribution(reviewsForAnalysis)
    const reviewTrend = computeTrend(reviewsForAnalysis)
    const tags = extractTopTags(reviewsForAnalysis)
    const { pros, cons } = computeProsAndCons(allReviews)
    const standoutQuote = findStandoutQuote(reviewsForAnalysis)

    const result: ResearchResult = {
      courseCode: matchedCourse?.courseName || classQuery || null,
      courseFullName: matchedCourse?.courseName || classQuery || null,
      professorFound: true,
      notFoundReason: null,

      professorFirstName: details.firstName,
      professorLastName: details.lastName,
      department: details.department,
      rmpUrl: `https://www.ratemyprofessors.com/professor/${details.legacyId}`,

      overallRating: details.avgRating,
      overallRatingCount: details.numRatings,
      difficulty: details.avgDifficulty,
      wouldTakeAgain: details.wouldTakeAgainPercent !== -1 ? Math.round(details.wouldTakeAgainPercent) : null,

      classSpecificRating: classSpecificRating !== null ? Math.round(classSpecificRating * 10) / 10 : null,
      classSpecificRatingCount: classSpecificReviews.length,
      classSpecificDifficulty: classSpecificDifficulty !== null ? Math.round(classSpecificDifficulty * 10) / 10 : null,
      hasClassSpecificData,

      availableCourses: availableCourses.length > 0 ? availableCourses : null,

      gradeDistribution,
      reviewTrend,
      verdict,

      reviews: allReviews.slice(0, 10), // Top 10 overall reviews
      classSpecificReviews: hasClassSpecificData ? classSpecificReviews.slice(0, 10) : null,

      aiSummary: generateSummary(
        `${details.firstName} ${details.lastName}`,
        matchedCourse?.courseName || null,
        hasClassSpecificData ? classSpecificRating! : details.avgRating,
        details.wouldTakeAgainPercent !== -1 ? details.wouldTakeAgainPercent : null,
        reviewsForAnalysis,
        hasClassSpecificData,
      ),
      classSpecificInsights: hasClassSpecificData
        ? `Based on ${classSpecificReviews.length} reviews specifically for ${matchedCourse?.courseName || classQuery}, this class is rated ${classSpecificRating!.toFixed(1)}/5 compared to the professor's overall ${details.avgRating.toFixed(1)}/5.`
        : classQuery 
          ? `No reviews found for "${classQuery}". This professor has reviews for: ${availableCourses.slice(0, 5).map(c => c.courseName).join(', ')}${availableCourses.length > 5 ? `, and ${availableCourses.length - 5} more` : ''}.`
          : null,
      standoutQuote,

      tags,
      pros,
      cons,

      sources: [
        { 
          name: 'Rate My Professors', 
          type: 'rmp', 
          reviewCount: hasClassSpecificData ? classSpecificReviews.length : details.numRatings,
          url: `https://www.ratemyprofessors.com/professor/${details.legacyId}`,
        },
      ],
    }

    return Response.json(result)

  } catch (error) {
    console.error('[ProfLens API] Error:', error)
    return Response.json(
      { error: 'Research failed. Please try again.' },
      { status: 500 },
    )
  }
}
