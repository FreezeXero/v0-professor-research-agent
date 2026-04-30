import { NextRequest } from 'next/server'

const RMP_ENDPOINT = 'https://www.ratemyprofessors.com/graphql'
const RMP_AUTH = 'dGVzdDp0ZXN0'

// Search professors by name only, no school filter
const TEACHER_SEARCH_QUERY = `
query TeacherSearchQuery($text: String!) {
  newSearch {
    teachers(query: {text: $text}) {
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
            id
            name
            city
            state
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

async function tryRMPFetch(professorName: string) {
  try {
    const response = await fetch(RMP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${RMP_AUTH}`,
      },
      body: JSON.stringify({
        query: TEACHER_SEARCH_QUERY,
        variables: { text: professorName },
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.errors) {
      return null
    }

    return data?.data?.newSearch?.teachers?.edges || []
  } catch {
    return null
  }
}

// Realistic mock data for demo purposes
function getMockData(professorName: string, schoolName: string) {
  const nameParts = professorName.toLowerCase().trim().split(/\s+/)
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts[0]

  // Generate consistent but realistic data based on name hash
  const hash = (lastName + firstName).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  const seed = Math.abs(hash)

  // Determine department based on common patterns
  const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Psychology', 'Economics', 'English', 'History', 'Engineering']
  const department = departments[seed % departments.length]

  // Generate realistic ratings (most professors are between 2.5-4.5)
  const avgRating = 2.5 + (seed % 200) / 100 // 2.5 to 4.5
  const avgDifficulty = 2.0 + (seed % 250) / 100 // 2.0 to 4.5
  const numRatings = 10 + (seed % 150) // 10 to 160 ratings
  const wouldTakeAgainPercent = 30 + (seed % 60) // 30% to 90%

  // Generate course codes based on department
  const coursePrefixes: Record<string, string> = {
    'Computer Science': 'CSS',
    'Mathematics': 'MATH',
    'Physics': 'PHYS',
    'Chemistry': 'CHEM',
    'Biology': 'BIOL',
    'Psychology': 'PSYCH',
    'Economics': 'ECON',
    'English': 'ENGL',
    'History': 'HIST',
    'Engineering': 'ENGR',
  }
  const prefix = coursePrefixes[department] || 'DEPT'

  // Generate 3-5 courses this professor teaches
  const courseNumbers = [101, 142, 143, 200, 240, 301, 342, 343, 350, 401, 450]
  const numCourses = 3 + (seed % 3)
  const courses: { name: string; count: number }[] = []
  for (let i = 0; i < numCourses; i++) {
    const courseNum = courseNumbers[(seed + i * 7) % courseNumbers.length]
    courses.push({
      name: `${prefix} ${courseNum}`,
      count: 5 + ((seed + i) % 30),
    })
  }

  // Generate realistic reviews
  const positiveComments = [
    "Great professor! Explains concepts clearly and is always willing to help during office hours.",
    "One of the best professors I've had. Makes difficult material accessible and engaging.",
    "Really cares about student success. Fair grader and provides helpful feedback.",
    "Lectures are well-organized and the examples really help understand the material.",
    "Challenging but rewarding class. You'll learn a lot if you put in the effort.",
    "Very knowledgeable and passionate about the subject. Makes class interesting.",
    "Clear explanations and reasonable workload. Would definitely recommend.",
    "Approachable and helpful. Always responds to emails quickly.",
  ]

  const mixedComments = [
    "Decent professor but lectures can be a bit dry. Textbook helps a lot.",
    "Fair grader but homework can be time-consuming. Start assignments early.",
    "Knows the material well but sometimes goes too fast. Ask questions!",
    "Good professor overall but attendance is mandatory which is annoying.",
    "Tests are hard but fair. Make sure to study the practice problems.",
    "Helpful in office hours but lectures can be confusing sometimes.",
  ]

  const negativeComments = [
    "Tough grader and lectures are hard to follow. Read the textbook.",
    "Not very organized. Assignments instructions are often unclear.",
    "Tests are much harder than homework. Prepare accordingly.",
    "Moves too fast and doesn't explain things well. Self-study required.",
  ]

  // Select comments based on rating
  let commentPool: string[]
  if (avgRating >= 4.0) {
    commentPool = [...positiveComments, ...mixedComments.slice(0, 2)]
  } else if (avgRating >= 3.0) {
    commentPool = [...mixedComments, ...positiveComments.slice(0, 2), ...negativeComments.slice(0, 1)]
  } else {
    commentPool = [...negativeComments, ...mixedComments.slice(0, 2)]
  }

  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
  const tags = ['Caring', 'Respected', 'Accessible outside class', 'Clear grading criteria', 'Inspirational', 'Lots of homework', 'Tough grader', 'Get ready to read', 'Lecture heavy', 'Test heavy']

  const reviews = []
  const reviewCount = Math.min(numRatings, 15)
  for (let i = 0; i < reviewCount; i++) {
    const reviewSeed = seed + i * 13
    const rating = Math.max(1, Math.min(5, avgRating + (((reviewSeed % 20) - 10) / 10)))
    const difficulty = Math.max(1, Math.min(5, avgDifficulty + (((reviewSeed % 16) - 8) / 10)))
    const course = courses[i % courses.length]
    const gradeIndex = Math.floor((rating / 5) * 6) + (reviewSeed % 3) - 1
    const grade = grades[Math.max(0, Math.min(grades.length - 1, gradeIndex))]

    // Generate date within last 3 years
    const daysAgo = (reviewSeed % 1000) + 30
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() - daysAgo)

    reviews.push({
      id: `mock-${i}`,
      class: course.name,
      comment: commentPool[i % commentPool.length],
      date: reviewDate.toISOString().split('T')[0],
      thumbsUp: reviewSeed % 15,
      thumbsDown: reviewSeed % 5,
      grade,
      difficulty: Math.round(difficulty * 10) / 10,
      quality: Math.round(rating * 10) / 10,
      wouldTakeAgain: rating >= 3 ? 1 : 0,
      tags: [tags[(reviewSeed) % tags.length], tags[(reviewSeed + 3) % tags.length]],
    })
  }

  // Extract school city/state from name if possible
  let city = 'Seattle'
  let state = 'WA'
  if (schoolName.toLowerCase().includes('bothell')) {
    city = 'Bothell'
  } else if (schoolName.toLowerCase().includes('tacoma')) {
    city = 'Tacoma'
  } else if (schoolName.toLowerCase().includes('california') || schoolName.toLowerCase().includes('ucla') || schoolName.toLowerCase().includes('usc')) {
    city = 'Los Angeles'
    state = 'CA'
  } else if (schoolName.toLowerCase().includes('boston') || schoolName.toLowerCase().includes('mit') || schoolName.toLowerCase().includes('harvard')) {
    city = 'Boston'
    state = 'MA'
  } else if (schoolName.toLowerCase().includes('new york') || schoolName.toLowerCase().includes('nyu') || schoolName.toLowerCase().includes('columbia')) {
    city = 'New York'
    state = 'NY'
  }

  // Generate a realistic legacy ID
  const legacyId = 1000000 + (seed % 1000000)

  return {
    found: true,
    isMockData: true,
    professor: {
      id: `mock-prof-${seed}`,
      legacyId,
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      department,
      school: schoolName,
      schoolId: `mock-school-${seed % 10000}`,
      avgRating: Math.round(avgRating * 10) / 10,
      avgDifficulty: Math.round(avgDifficulty * 10) / 10,
      numRatings,
      wouldTakeAgainPercent,
      ratingsDistribution: {
        total: numRatings,
        r5: Math.floor(numRatings * (avgRating / 5) * 0.4),
        r4: Math.floor(numRatings * 0.3),
        r3: Math.floor(numRatings * 0.15),
        r2: Math.floor(numRatings * 0.1),
        r1: Math.floor(numRatings * 0.05),
      },
      tags: tags.slice(0, 5),
      city,
      state,
    },
    ratings: reviews,
    availableClasses: courses,
  }
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

  // Parse professor name for matching
  const nameParts = professorName.toLowerCase().trim().split(/\s+/).filter(p => p.length > 0)
  const searchLastName = nameParts[nameParts.length - 1]
  const searchFirstName = nameParts.length > 1 ? nameParts[0] : null

  // Try RMP API first - search by name only
  const teachers = await tryRMPFetch(professorName)

  if (teachers && teachers.length > 0) {
    // Filter by school name match and exact last name match
    const normalizedSchool = schoolName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const schoolWords = normalizedSchool.split(/\s+/).filter(w => w.length > 2)

    let bestMatch = null
    let bestScore = 0

    for (const edge of teachers) {
      const node = edge.node
      const profLastName = node.lastName.toLowerCase()
      const profFirstName = node.firstName.toLowerCase()
      const profSchool = (node.school?.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '')

      // MUST match last name exactly
      if (profLastName !== searchLastName) continue

      // If first name provided, it should match
      if (searchFirstName && !profFirstName.startsWith(searchFirstName) && !searchFirstName.startsWith(profFirstName)) {
        continue
      }

      // Score school match
      let schoolScore = 0
      const profSchoolWords = profSchool.split(/\s+/)
      for (const word of schoolWords) {
        if (profSchoolWords.some(pw => pw.includes(word) || word.includes(pw))) {
          schoolScore += 10
        }
      }

      // Exact school match bonus
      if (profSchool.includes(normalizedSchool) || normalizedSchool.includes(profSchool)) {
        schoolScore += 50
      }

      // Check for campus matches (bothell, tacoma, seattle, etc.)
      const campuses = ['bothell', 'tacoma', 'seattle', 'los angeles', 'berkeley', 'davis', 'san diego', 'santa barbara', 'irvine', 'riverside']
      for (const campus of campuses) {
        if (normalizedSchool.includes(campus) && profSchool.includes(campus)) {
          schoolScore += 100
        }
        if (normalizedSchool.includes(campus) && !profSchool.includes(campus)) {
          schoolScore -= 50 // Wrong campus penalty
        }
      }

      if (schoolScore > bestScore) {
        bestScore = schoolScore
        bestMatch = node
      }
    }

    if (bestMatch && bestScore > 0) {
      // Found a real match from RMP
      const ratings = bestMatch.ratings?.edges?.map((e: { node: unknown }) => e.node) || []

      // Get unique classes
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

      const tags = (bestMatch.teacherRatingTags || [])
        .sort((a: { tagCount: number }, b: { tagCount: number }) => b.tagCount - a.tagCount)
        .slice(0, 10)
        .map((t: { tagName: string }) => t.tagName)

      return Response.json({
        found: true,
        isMockData: false,
        professor: {
          id: bestMatch.id,
          legacyId: bestMatch.legacyId,
          firstName: bestMatch.firstName,
          lastName: bestMatch.lastName,
          department: bestMatch.department,
          school: bestMatch.school?.name || schoolName,
          schoolId: bestMatch.school?.id,
          avgRating: bestMatch.avgRating,
          avgDifficulty: bestMatch.avgDifficulty,
          numRatings: bestMatch.numRatings,
          wouldTakeAgainPercent: bestMatch.wouldTakeAgainPercent,
          ratingsDistribution: bestMatch.ratingsDistribution,
          tags,
          city: bestMatch.school?.city,
          state: bestMatch.school?.state,
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
    }
  }

  // RMP failed or no match found - use realistic mock data
  const mockData = getMockData(professorName, schoolName)
  return Response.json(mockData)
}
