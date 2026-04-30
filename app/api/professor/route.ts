import { NextRequest } from 'next/server'

const RMP_ENDPOINT = 'https://www.ratemyprofessors.com/graphql'
const RMP_AUTH = 'dGVzdDp0ZXN0'

// Search for school by name
const SCHOOL_SEARCH_QUERY = `
  query SchoolSearchQuery($query: SchoolSearchQuery!) {
    newSearch {
      schools(query: $query) {
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

// Search for professor with all their ratings
const TEACHER_SEARCH_QUERY = `
  query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
    newSearch {
      teachers(query: { text: $text, schoolID: $schoolID }) {
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
          }
        }
      }
    }
  }
`

// Get detailed ratings for a professor
const TEACHER_RATINGS_QUERY = `
  query TeacherRatingsPageQuery($id: ID!) {
    node(id: $id) {
      ... on Teacher {
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
`

async function rmpFetch(query: string, variables: Record<string, unknown>) {
  const response = await fetch(RMP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${RMP_AUTH}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[v0] RMP API error:', response.status, text.substring(0, 200))
    throw new Error(`RMP API error: ${response.status}`)
  }

  return response.json()
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
    // Step 1: Find the school
    const schoolResult = await rmpFetch(SCHOOL_SEARCH_QUERY, {
      query: { text: schoolName }
    })

    const schools = schoolResult?.data?.newSearch?.schools?.edges || []
    if (schools.length === 0) {
      return Response.json({
        found: false,
        error: `School "${schoolName}" not found on Rate My Professors`,
      })
    }

    // Find best matching school
    const normalizedSchool = schoolName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    let bestSchool = schools[0].node
    
    for (const edge of schools) {
      const name = edge.node.name.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      if (name === normalizedSchool || name.includes(normalizedSchool) || normalizedSchool.includes(name)) {
        bestSchool = edge.node
        break
      }
    }

    // Step 2: Search for the professor at this school
    const teacherResult = await rmpFetch(TEACHER_SEARCH_QUERY, {
      text: professorName,
      schoolID: bestSchool.id,
    })

    const teachers = teacherResult?.data?.newSearch?.teachers?.edges || []
    if (teachers.length === 0) {
      return Response.json({
        found: false,
        error: `Professor "${professorName}" not found at ${bestSchool.name} on Rate My Professors. They may not have any ratings yet.`,
        schoolFound: bestSchool.name,
      })
    }

    // Find best matching professor (must match both first and last name)
    const nameParts = professorName.toLowerCase().trim().split(/\s+/)
    let matchedTeacher = null

    for (const edge of teachers) {
      const { firstName, lastName } = edge.node
      const firstLower = firstName.toLowerCase()
      const lastLower = lastName.toLowerCase()

      // Check if name parts match
      if (nameParts.length >= 2) {
        const matchesFirst = nameParts.some(p => 
          firstLower === p || firstLower.startsWith(p) || p.startsWith(firstLower)
        )
        const matchesLast = nameParts.some(p => 
          lastLower === p || lastLower.startsWith(p) || p.startsWith(lastLower)
        )
        if (matchesFirst && matchesLast) {
          matchedTeacher = edge.node
          break
        }
      } else if (nameParts.length === 1) {
        // Single name - match last name
        if (lastLower === nameParts[0] || lastLower.startsWith(nameParts[0])) {
          matchedTeacher = edge.node
          break
        }
      }
    }

    if (!matchedTeacher) {
      // List available professors for debugging
      const availableNames = teachers.slice(0, 5).map(
        (e: { node: { firstName: string; lastName: string } }) => 
          `${e.node.firstName} ${e.node.lastName}`
      )
      return Response.json({
        found: false,
        error: `Professor "${professorName}" not found at ${bestSchool.name}. Did you mean: ${availableNames.join(', ')}?`,
        schoolFound: bestSchool.name,
        suggestions: availableNames,
      })
    }

    // Step 3: Get detailed ratings for the matched professor
    const ratingsResult = await rmpFetch(TEACHER_RATINGS_QUERY, {
      id: matchedTeacher.id,
    })

    const professor = ratingsResult?.data?.node
    if (!professor) {
      return Response.json({
        found: true,
        professor: matchedTeacher,
        ratings: [],
        error: 'Could not fetch detailed ratings',
      })
    }

    // Extract ratings
    const ratings = professor.ratings?.edges?.map((e: { node: unknown }) => e.node) || []

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
    const tags = (professor.teacherRatingTags || [])
      .sort((a: { tagCount: number }, b: { tagCount: number }) => b.tagCount - a.tagCount)
      .slice(0, 10)
      .map((t: { tagName: string }) => t.tagName)

    return Response.json({
      found: true,
      professor: {
        id: professor.id,
        legacyId: professor.legacyId,
        firstName: professor.firstName,
        lastName: professor.lastName,
        department: professor.department,
        school: professor.school?.name || bestSchool.name,
        avgRating: professor.avgRating,
        avgDifficulty: professor.avgDifficulty,
        numRatings: professor.numRatings,
        wouldTakeAgainPercent: professor.wouldTakeAgainPercent,
        ratingsDistribution: professor.ratingsDistribution,
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
      { found: false, error: 'Failed to fetch professor data. Please try again.' },
      { status: 500 }
    )
  }
}
