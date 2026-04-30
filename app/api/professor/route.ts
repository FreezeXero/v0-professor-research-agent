import { NextRequest } from 'next/server'

const RMP_ENDPOINT = 'https://www.ratemyprofessors.com/graphql'
const RMP_AUTH = 'dGVzdDp0ZXN0'

// Step 1: Search for school by name to get school ID
const SCHOOL_SEARCH_QUERY = `
  query {
    newSearch {
      schools(query: { text: "$SCHOOL_NAME" }) {
        edges {
          node {
            id
            name
            city
            state
          }
        }
      }
    }
  }
`

// Step 2: Search for professor using school ID
const TEACHER_SEARCH_QUERY = `
  query {
    newSearch {
      teachers(query: { text: "$PROFESSOR_NAME", schoolID: "$SCHOOL_ID" }) {
        edges {
          node {
            id
            legacyId
            firstName
            lastName
            avgRating
            avgDifficulty
            numRatings
            wouldTakeAgainPercent
            department
            school {
              name
              id
            }
            ratingsDistribution {
              total
              r1
              r2
              r3
              r4
              r5
            }
            teacherRatingTags {
              tagName
              tagCount
            }
            ratings(first: 50) {
              edges {
                node {
                  id
                  class
                  comment
                  date
                  thumbsUpTotal
                  thumbsDownTotal
                  grade
                  difficultyRating
                  clarityRating
                  helpfulRating
                  wouldTakeAgain
                  isForOnlineClass
                  attendanceMandatory
                  ratingTags
                }
              }
            }
          }
        }
      }
    }
  }
`

async function rmpFetch(query: string) {
  const response = await fetch(RMP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${RMP_AUTH}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[v0] RMP API error:', response.status, text.substring(0, 500))
    throw new Error(`RMP API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.errors) {
    console.error('[v0] GraphQL errors:', JSON.stringify(data.errors))
  }
  
  return data
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const professorName = searchParams.get('name')
  const schoolName = searchParams.get('school')

  if (!professorName || !schoolName) {
    return Response.json(
      { error: 'Missing required parameters: name and school' },
      { status: 400 }
    )
  }

  try {
    // Step 1: Search for the school to get its ID
    const schoolQuery = SCHOOL_SEARCH_QUERY.replace('$SCHOOL_NAME', schoolName.replace(/"/g, '\\"'))
    const schoolResult = await rmpFetch(schoolQuery)

    const schools = schoolResult?.data?.newSearch?.schools?.edges || []
    if (schools.length === 0) {
      return Response.json({
        found: false,
        error: `School "${schoolName}" not found on Rate My Professors`,
      })
    }

    // Find best matching school - prioritize exact or close matches
    const normalizedInput = schoolName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    let bestSchool = schools[0].node
    let bestScore = 0
    
    for (const edge of schools) {
      const name = edge.node.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      let score = 0
      
      // Exact match
      if (name === normalizedInput) {
        score = 1000
      }
      // Input contains school name or vice versa
      else if (name.includes(normalizedInput) || normalizedInput.includes(name)) {
        score = 500
      }
      // Check word overlap
      else {
        const inputWords = normalizedInput.split(/\s+/)
        const nameWords = name.split(/\s+/)
        const matches = inputWords.filter(w => nameWords.some(nw => nw.includes(w) || w.includes(nw)))
        score = matches.length * 100
      }
      
      if (score > bestScore) {
        bestScore = score
        bestSchool = edge.node
      }
    }

    const schoolId = bestSchool.id

    // Step 2: Search for the professor at this school using the school ID
    const teacherQuery = TEACHER_SEARCH_QUERY
      .replace('$PROFESSOR_NAME', professorName.replace(/"/g, '\\"'))
      .replace('$SCHOOL_ID', schoolId)
    
    const teacherResult = await rmpFetch(teacherQuery)

    const teachers = teacherResult?.data?.newSearch?.teachers?.edges || []
    if (teachers.length === 0) {
      return Response.json({
        found: false,
        error: `Professor "${professorName}" not found at ${bestSchool.name} on Rate My Professors. They may not have any ratings yet.`,
        schoolFound: bestSchool.name,
        schoolId: schoolId,
      })
    }

    // Find best matching professor - must match both first AND last name
    const nameParts = professorName.toLowerCase().trim().split(/\s+/).filter(p => p.length > 0)
    let matchedTeacher = null
    let matchedNode = null

    for (const edge of teachers) {
      const node = edge.node
      const firstLower = node.firstName.toLowerCase()
      const lastLower = node.lastName.toLowerCase()
      const fullName = `${firstLower} ${lastLower}`

      // Exact full name match
      if (fullName === professorName.toLowerCase().trim()) {
        matchedTeacher = node
        matchedNode = edge
        break
      }

      // Check if both first and last name have matches
      if (nameParts.length >= 2) {
        const matchesFirst = nameParts.some(p => 
          firstLower === p || 
          firstLower.startsWith(p) || 
          p.startsWith(firstLower)
        )
        const matchesLast = nameParts.some(p => 
          lastLower === p || 
          lastLower.startsWith(p) || 
          p.startsWith(lastLower)
        )
        
        if (matchesFirst && matchesLast) {
          matchedTeacher = node
          matchedNode = edge
          break
        }
      } else if (nameParts.length === 1) {
        // Single name search - must match last name
        if (lastLower === nameParts[0] || lastLower.startsWith(nameParts[0])) {
          matchedTeacher = node
          matchedNode = edge
          break
        }
      }
    }

    if (!matchedTeacher || !matchedNode) {
      const availableNames = teachers.slice(0, 5).map(
        (e: { node: { firstName: string; lastName: string } }) => 
          `${e.node.firstName} ${e.node.lastName}`
      )
      return Response.json({
        found: false,
        error: `Professor "${professorName}" not found at ${bestSchool.name}. Did you mean: ${availableNames.join(', ')}?`,
        schoolFound: bestSchool.name,
        schoolId: schoolId,
        suggestions: availableNames,
      })
    }

    // Extract ratings from the matched teacher
    const ratings = matchedTeacher.ratings?.edges?.map((e: { node: unknown }) => e.node) || []

    // Get unique classes this professor teaches
    const classCounts: Record<string, number> = {}
    for (const rating of ratings) {
      const cls = (rating as { class?: string }).class
      if (cls && cls.trim()) {
        const normalized = cls.trim().toUpperCase()
        classCounts[normalized] = (classCounts[normalized] || 0) + 1
      }
    }

    const availableClasses = Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    // Get tags
    const tags = (matchedTeacher.teacherRatingTags || [])
      .sort((a: { tagCount: number }, b: { tagCount: number }) => b.tagCount - a.tagCount)
      .slice(0, 10)
      .map((t: { tagName: string }) => t.tagName)

    return Response.json({
      found: true,
      professor: {
        id: matchedTeacher.id,
        legacyId: matchedTeacher.legacyId,
        firstName: matchedTeacher.firstName,
        lastName: matchedTeacher.lastName,
        department: matchedTeacher.department,
        school: matchedTeacher.school?.name || bestSchool.name,
        schoolId: schoolId,
        avgRating: matchedTeacher.avgRating,
        avgDifficulty: matchedTeacher.avgDifficulty,
        numRatings: matchedTeacher.numRatings,
        wouldTakeAgainPercent: matchedTeacher.wouldTakeAgainPercent,
        ratingsDistribution: matchedTeacher.ratingsDistribution,
        tags,
      },
      ratings: ratings.map((r: {
        id: string
        class?: string
        comment?: string
        date?: string
        thumbsUpTotal?: number
        thumbsDownTotal?: number
        grade?: string
        difficultyRating?: number
        clarityRating?: number
        helpfulRating?: number
        wouldTakeAgain?: number
        ratingTags?: string
      }) => ({
        id: r.id,
        class: r.class || 'Unknown',
        comment: r.comment || '',
        date: r.date,
        thumbsUp: r.thumbsUpTotal || 0,
        thumbsDown: r.thumbsDownTotal || 0,
        grade: r.grade,
        difficulty: r.difficultyRating,
        quality: r.clarityRating || r.helpfulRating,
        wouldTakeAgain: r.wouldTakeAgain,
        tags: r.ratingTags ? r.ratingTags.split('--').filter(Boolean) : [],
      })),
      availableClasses,
    })
  } catch (error) {
    console.error('[v0] Professor API error:', error)
    return Response.json(
      { found: false, error: 'Failed to fetch professor data from Rate My Professors. Please try again.' },
      { status: 500 }
    )
  }
}
