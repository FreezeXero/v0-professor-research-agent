import { generateText, Output } from 'ai'
import { z } from 'zod'

export const maxDuration = 60

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

export async function POST(req: Request) {
  try {
    const { university, professor, classQuery } = await req.json()

    if (!university || !professor) {
      return Response.json({ error: 'University and professor name are required.' }, { status: 400 })
    }

    const result = await generateText({
      model: 'openai/gpt-4o',
      output: Output.object({ schema: ResearchResultSchema }),
      system: `You are ProfLens, an expert academic research agent. Your job is to provide detailed, accurate information about professors based on your training data, which includes knowledge of Rate My Professor reviews, Reddit discussions (like r/college, university-specific subreddits), and other academic review platforms.

CRITICAL INSTRUCTIONS:
1. Be REALISTIC and SPECIFIC. If you know about this professor, provide real information from your training data. If you don't have specific data, estimate based on department averages but clearly note lower confidence.
2. For ratings, use the 1-5 scale (Rate My Professor scale). Ratings should be realistic: most professors are 3.0-4.5, not perfect 5.0.
3. Review counts should be realistic: popular classes at large universities might have 200-800 reviews; smaller programs or community colleges might have 5-30 reviews.
4. Class-specific ratings OFTEN differ meaningfully from overall ratings (±0.3 to ±1.2 points) — this is the key insight users want.
5. Always map informal class names to formal course codes for the specific university.
6. Tags should be specific and insightful (e.g., "Heavy curved exams", "Weekly quizzes", "Mandatory attendance", "Curved grades").
7. The standoutQuote should feel authentic, like something a real student would write.
8. If the professor genuinely doesn't exist in your training data, set professorFound to false.
9. Pros and cons should be specific and actionable, not generic platitudes.
10. The AI summary (2-3 sentences) should feel like a knowledgeable friend giving you honest advice.`,
      messages: [
        {
          role: 'user',
          content: `Research this professor for me:
University: ${university}
Professor Name: ${professor}
Class I'm interested in: ${classQuery || 'general'}

Please provide comprehensive research including:
1. Map "${classQuery}" to the formal course code at ${university}
2. Overall professor stats from Rate My Professor (overall rating, review count, difficulty, would-take-again %)
3. Class-specific stats for "${classQuery}" specifically — is the rating different for this class vs their overall?
4. A plain-English summary of what students actually say
5. Key insights about taking this professor for THIS specific class
6. The best student quote that captures the consensus
7. Realistic pros and cons
8. Tags (short phrases about class style)
9. Source breakdown (how many reviews from RMP vs Reddit)`,
        },
      ],
    })

    return Response.json(result.object)
  } catch (error) {
    console.error('[ProfLens API] Error:', error)
    return Response.json(
      { error: 'Research failed. The AI encountered an issue. Please try again.' },
      { status: 500 },
    )
  }
}
