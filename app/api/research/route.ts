import { z } from 'zod'

export const maxDuration = 60

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

const ResearchResultSchema = z.object({
  courseCode: z.string().nullable(),
  courseFullName: z.string().nullable(),
  professorFound: z.boolean(),
  notFoundReason: z.string().nullable(),

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

  // Grade distribution
  gradeDistribution: GradeDistributionSchema.nullable(),

  // Review trend
  reviewTrend: ReviewTrendSchema.nullable(),

  // Verdict
  verdict: z.enum(['take', 'avoid', 'mixed']).nullable(),

  // Summaries
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

// Course code mapping for common informal class names
const courseCodeMappings: Record<string, Record<string, { code: string; name: string }>> = {
  'calc 3': {
    'default': { code: 'MATH 126', name: 'Multivariable Calculus' },
    'university of washington': { code: 'MATH 126', name: 'Calculus with Analytic Geometry III' },
    'mit': { code: '18.02', name: 'Multivariable Calculus' },
    'ucla': { code: 'MATH 32B', name: 'Calculus of Several Variables' },
    'uc berkeley': { code: 'MATH 53', name: 'Multivariable Calculus' },
    'stanford': { code: 'MATH 52', name: 'Integral Calculus of Several Variables' },
    'usc': { code: 'MATH 226', name: 'Calculus III' },
  },
  'intro to ai': {
    'default': { code: 'CS 188', name: 'Introduction to Artificial Intelligence' },
    'mit': { code: '6.034', name: 'Artificial Intelligence' },
    'stanford': { code: 'CS 221', name: 'Artificial Intelligence: Principles and Techniques' },
    'uc berkeley': { code: 'CS 188', name: 'Introduction to Artificial Intelligence' },
  },
  'linear algebra': {
    'default': { code: 'MATH 308', name: 'Linear Algebra' },
    'ucla': { code: 'MATH 33A', name: 'Linear Algebra and Applications' },
    'mit': { code: '18.06', name: 'Linear Algebra' },
    'uc berkeley': { code: 'MATH 54', name: 'Linear Algebra and Differential Equations' },
  },
  'intro to psych': {
    'default': { code: 'PSYCH 101', name: 'Introduction to Psychology' },
    'university of washington': { code: 'PSYCH 101', name: 'Introduction to Psychology' },
    'ucla': { code: 'PSYCH 10', name: 'Introductory Psychology' },
  },
  'data structures': {
    'default': { code: 'CS 201', name: 'Data Structures' },
    'university of washington': { code: 'CSE 143', name: 'Computer Programming II' },
    'mit': { code: '6.006', name: 'Introduction to Algorithms' },
    'uc berkeley': { code: 'CS 61B', name: 'Data Structures' },
  },
  'organic chemistry': {
    'default': { code: 'CHEM 238', name: 'Organic Chemistry I' },
    'ucla': { code: 'CHEM 30A', name: 'Organic Chemistry I' },
  },
  'physics 1': {
    'default': { code: 'PHYS 121', name: 'Mechanics' },
    'mit': { code: '8.01', name: 'Physics I' },
    'uc berkeley': { code: 'PHYSICS 7A', name: 'Physics for Scientists and Engineers' },
  },
}

// Mock professor data
const mockProfessors: Record<string, ResearchResult> = {
  'john braun': {
    courseCode: 'MATH 126',
    courseFullName: 'Calculus with Analytic Geometry III',
    professorFound: true,
    notFoundReason: null,
    overallRating: 4.2,
    overallRatingCount: 847,
    difficulty: 3.8,
    wouldTakeAgain: 78,
    classSpecificRating: 4.5,
    classSpecificRatingCount: 156,
    classSpecificDifficulty: 3.6,
    hasClassSpecificData: true,
    gradeDistribution: { A: 35, B: 40, C: 18, D: 5, F: 2 },
    reviewTrend: { direction: 'up', description: 'Recent reviews are more positive than older ones' },
    verdict: 'take',
    aiSummary: "Dr. Braun is consistently praised for his clear explanations and genuine care for student success. He's known for being approachable during office hours and making multivariable calculus accessible. Just don't skip lectures — attendance really matters.",
    classSpecificInsights: "In MATH 126 specifically, students say Braun excels at visualizing 3D concepts. His in-class demos with graphing software are legendary. The midterms are fair but the final is comprehensive — start reviewing early.",
    standoutQuote: "Best calc professor I've had. Actually made me understand triple integrals, which I thought was impossible.",
    tags: ['Clear explanations', 'Helpful office hours', 'Fair exams', 'Attendance matters', 'Great visualizations'],
    pros: ['Explains complex topics clearly', 'Very approachable during office hours', 'Exams reflect what he teaches', 'Passionate about the subject'],
    cons: ['Lectures can run over time', 'Homework is time-consuming', 'Strict about attendance'],
    sources: [
      { name: 'Rate My Professor', type: 'rmp', reviewCount: 156, url: 'https://www.ratemyprofessors.com' },
      { name: 'r/udub', type: 'reddit', reviewCount: 23, url: 'https://reddit.com/r/udub' },
    ],
  },
  'patrick winston': {
    courseCode: '6.034',
    courseFullName: 'Artificial Intelligence',
    professorFound: true,
    notFoundReason: null,
    overallRating: 4.8,
    overallRatingCount: 523,
    difficulty: 4.2,
    wouldTakeAgain: 94,
    classSpecificRating: 4.9,
    classSpecificRatingCount: 312,
    classSpecificDifficulty: 4.0,
    hasClassSpecificData: true,
    gradeDistribution: { A: 45, B: 35, C: 15, D: 4, F: 1 },
    reviewTrend: { direction: 'stable', description: 'Consistently excellent reviews over the years' },
    verdict: 'take',
    aiSummary: "A legendary MIT professor whose AI course is a rite of passage. Winston's teaching style is theatrical and memorable — you'll leave understanding not just AI algorithms but how to think about thinking. His lectures are often standing-room only.",
    classSpecificInsights: "6.034 with Winston is an experience. The course covers search, learning, and knowledge representation with his unique storytelling approach. The problem sets are challenging but deeply rewarding. Take notes by hand — you'll want to remember his insights.",
    standoutQuote: "Winston doesn't just teach AI, he teaches you how to be a better thinker. This class changed how I approach problems.",
    tags: ['Legendary lecturer', 'Challenging material', 'Thought-provoking', 'Must-take class', 'Story-based teaching'],
    pros: ['Unforgettable lectures', 'Deep conceptual understanding', 'Inspiring teaching style', 'Fair grading'],
    cons: ['Very demanding workload', 'Can be abstract at times', 'Limited availability outside class'],
    sources: [
      { name: 'Rate My Professor', type: 'rmp', reviewCount: 312, url: 'https://www.ratemyprofessors.com' },
      { name: 'r/MIT', type: 'reddit', reviewCount: 89, url: 'https://reddit.com/r/MIT' },
    ],
  },
  'zach hamaker': {
    courseCode: 'MATH 33A',
    courseFullName: 'Linear Algebra and Applications',
    professorFound: true,
    notFoundReason: null,
    overallRating: 3.9,
    overallRatingCount: 234,
    difficulty: 3.5,
    wouldTakeAgain: 65,
    classSpecificRating: 3.4,
    classSpecificRatingCount: 67,
    classSpecificDifficulty: 3.9,
    hasClassSpecificData: true,
    gradeDistribution: { A: 25, B: 35, C: 28, D: 8, F: 4 },
    reviewTrend: { direction: 'down', description: 'Some recent reviews mention pacing issues' },
    verdict: 'mixed',
    aiSummary: "Dr. Hamaker knows his stuff but his teaching style doesn't work for everyone. Some students love his proof-heavy approach, while others feel lost. If you're strong in abstract math, you might enjoy it. Otherwise, supplement with YouTube.",
    classSpecificInsights: "In MATH 33A, reviews are more mixed than his overall rating suggests. The class moves fast and he assumes strong proof-writing skills. The textbook helps, but many students rely on 3Blue1Brown videos to visualize concepts.",
    standoutQuote: "Smart guy, but I learned more from YouTube than from lectures. Go to office hours or you'll struggle.",
    tags: ['Proof-heavy', 'Fast-paced', 'Abstract approach', 'Office hours essential', 'Mixed reviews'],
    pros: ['Very knowledgeable', 'Available during office hours', 'Interesting proofs'],
    cons: ['Lectures can be confusing', 'Assumes prior knowledge', 'Pacing issues', 'Tests harder than homework'],
    sources: [
      { name: 'Rate My Professor', type: 'rmp', reviewCount: 67, url: 'https://www.ratemyprofessors.com' },
      { name: 'r/ucla', type: 'reddit', reviewCount: 12, url: 'https://reddit.com/r/ucla' },
    ],
  },
}

// Generate realistic mock data for any professor
function generateMockData(professor: string, university: string, classQuery: string): ResearchResult {
  const normalizedClass = classQuery.toLowerCase().trim()
  const normalizedUni = university.toLowerCase()
  
  // Get course code mapping
  const courseMappings = courseCodeMappings[normalizedClass]
  let courseCode = 'CS 101'
  let courseFullName = classQuery
  
  if (courseMappings) {
    const mapping = courseMappings[normalizedUni] || courseMappings['default']
    if (mapping) {
      courseCode = mapping.code
      courseFullName = mapping.name
    }
  }

  // Generate semi-random but consistent ratings based on professor name hash
  const hash = professor.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const overallRating = 3.0 + (hash % 20) / 10 // 3.0 - 5.0
  const classSpecificOffset = ((hash % 10) - 5) / 10 // -0.5 to +0.4
  const classSpecificRating = Math.min(5, Math.max(1, overallRating + classSpecificOffset))
  
  const reviewCount = 50 + (hash % 500)
  const classReviewCount = Math.floor(reviewCount * (0.15 + (hash % 20) / 100))
  
  const difficulty = 2.5 + (hash % 25) / 10
  const wouldTakeAgain = Math.floor(45 + (hash % 50))
  
  const verdictScore = (classSpecificRating * 0.6 + wouldTakeAgain / 20 * 0.4)
  const verdict: 'take' | 'avoid' | 'mixed' = verdictScore >= 4.0 ? 'take' : verdictScore >= 3.2 ? 'mixed' : 'avoid'
  
  const trendOptions: Array<{ direction: 'up' | 'down' | 'stable'; description: string }> = [
    { direction: 'up', description: 'Recent reviews show improvement in teaching style' },
    { direction: 'down', description: 'Some recent reviews mention concerns about course pacing' },
    { direction: 'stable', description: 'Consistent feedback across recent and older reviews' },
  ]
  
  return {
    courseCode,
    courseFullName,
    professorFound: true,
    notFoundReason: null,
    overallRating: Math.round(overallRating * 10) / 10,
    overallRatingCount: reviewCount,
    difficulty: Math.round(difficulty * 10) / 10,
    wouldTakeAgain,
    classSpecificRating: Math.round(classSpecificRating * 10) / 10,
    classSpecificRatingCount: classReviewCount,
    classSpecificDifficulty: Math.round((difficulty + ((hash % 10) - 5) / 10) * 10) / 10,
    hasClassSpecificData: classReviewCount > 5,
    gradeDistribution: {
      A: 20 + (hash % 30),
      B: 30 + (hash % 15),
      C: 15 + (hash % 15),
      D: 5 + (hash % 8),
      F: 2 + (hash % 5),
    },
    reviewTrend: trendOptions[hash % 3],
    verdict,
    aiSummary: `Professor ${professor.split(' ').pop()} teaches ${courseCode} at ${university}. Based on student reviews, they are known for ${verdict === 'take' ? 'engaging lectures and fair assessments' : verdict === 'avoid' ? 'challenging exams and fast-paced lectures' : 'a teaching style that works well for some students but not others'}. ${wouldTakeAgain}% of students would take this class again.`,
    classSpecificInsights: classReviewCount > 5 
      ? `In ${courseCode} specifically, students note that the professor ${classSpecificRating > overallRating ? 'excels' : 'faces some challenges'} with this material. The class is rated ${classSpecificRating.toFixed(1)}/5 compared to their overall ${overallRating.toFixed(1)}/5.`
      : null,
    standoutQuote: verdict === 'take' 
      ? "Really helped me understand the material. Would definitely recommend to anyone taking this class."
      : verdict === 'avoid'
        ? "Study hard and use outside resources. The lectures alone won't be enough."
        : "Hit or miss depending on your learning style. Give it a shot but have a backup plan.",
    tags: ['Lectures recorded', 'Weekly quizzes', 'Curved finals', 'Office hours helpful'],
    pros: ['Knowledgeable about subject', 'Clear syllabus', 'Responsive to email'],
    cons: ['Fast-paced lectures', 'Heavy workload', 'Tough grading'],
    sources: [
      { name: 'Rate My Professor', type: 'rmp', reviewCount: classReviewCount, url: 'https://www.ratemyprofessors.com' },
      { name: 'r/' + university.split(' ')[0].toLowerCase(), type: 'reddit', reviewCount: Math.floor(classReviewCount * 0.3), url: 'https://reddit.com' },
    ],
  }
}

export async function POST(req: Request) {
  try {
    const { university, professor, classQuery } = await req.json()

    if (!university || !professor) {
      return Response.json({ error: 'University and professor name are required.' }, { status: 400 })
    }

    // Check for known mock professors
    const normalizedProf = professor.toLowerCase().trim()
    if (mockProfessors[normalizedProf]) {
      // Update course code based on university if needed
      const result = { ...mockProfessors[normalizedProf] }
      
      // Update course code based on class query and university
      if (classQuery) {
        const normalizedClass = classQuery.toLowerCase().trim()
        const normalizedUni = university.toLowerCase()
        const courseMappings = courseCodeMappings[normalizedClass]
        if (courseMappings) {
          const mapping = courseMappings[normalizedUni] || courseMappings['default']
          if (mapping) {
            result.courseCode = mapping.code
            result.courseFullName = mapping.name
          }
        }
      }
      
      // Simulate a small delay for realism
      await new Promise(resolve => setTimeout(resolve, 800))
      return Response.json(result)
    }

    // Generate realistic mock data for unknown professors
    await new Promise(resolve => setTimeout(resolve, 1200))
    const result = generateMockData(professor, university, classQuery || 'general')
    return Response.json(result)
    
  } catch (error) {
    console.error('[ProfLens API] Error:', error)
    return Response.json(
      { error: 'Research failed. Please try again.' },
      { status: 500 },
    )
  }
}
