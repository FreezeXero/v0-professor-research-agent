import { z } from 'zod'

export const maxDuration = 30

const WebSearchResultSchema = z.object({
  title: z.string(),
  snippet: z.string(),
  url: z.string(),
  source: z.enum(['reddit', 'web']),
})

export type WebSearchResult = z.infer<typeof WebSearchResultSchema>

const WebSearchResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(WebSearchResultSchema),
  error: z.string().nullable(),
})

async function tavily_search(query: string, includeReddit: boolean = true): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.error('[v0] TAVILY_API_KEY not set')
    return []
  }

  try {
    const searchQuery = includeReddit ? `${query} site:reddit.com professor reviews` : `${query} professor reviews`
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        max_results: 5,
        include_domains: includeReddit ? [] : [],
        exclude_domains: [],
      }),
    })

    if (!response.ok) {
      console.error(`[v0] Tavily API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      return []
    }

    // Map Tavily results to our format
    return data.results.map((result: any) => ({
      title: result.title || '',
      snippet: result.content || result.snippet || '',
      url: result.url || '',
      source: includeReddit && result.url?.includes('reddit.com') ? 'reddit' : 'web',
    })).filter((r: WebSearchResult) => r.title && r.snippet && r.url)
  } catch (error) {
    console.error('[v0] Tavily search error:', error)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const professorName = searchParams.get('name')
    const school = searchParams.get('school')

    if (!professorName || !school) {
      return Response.json(
        { success: false, results: [], error: 'Missing name or school parameter' },
        { status: 400 }
      )
    }

    // Search Reddit first
    const redditQuery = `"${professorName}" "${school}"`
    const redditResults = await tavily_search(redditQuery, true)

    // Then search the broader web
    const webQuery = `${professorName} ${school} professor`
    const webResults = await tavily_search(webQuery, false)

    // Combine and deduplicate by URL
    const allResults = [...redditResults, ...webResults]
    const seen = new Set<string>()
    const results: WebSearchResult[] = []

    for (const result of allResults) {
      if (!seen.has(result.url)) {
        seen.add(result.url)
        results.push(result)
        if (results.length >= 5) break
      }
    }

    return Response.json(
      { success: true, results, error: null },
      WebSearchResponseSchema
    )
  } catch (error) {
    console.error('[v0] Web search route error:', error)
    return Response.json(
      { success: false, results: [], error: 'Search failed' },
      { status: 500 }
    )
  }
}
