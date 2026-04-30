import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const professor = searchParams.get('professor')
  const school = searchParams.get('school')

  if (!professor || !school) {
    return Response.json({ results: [] })
  }

  try {
    const query = `"${professor}" "${school}" professor reviews`
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        include_domains: ['reddit.com', 'ratemyprofessors.com', 'quora.com'],
      }),
    })

    const data = await response.json()
    return Response.json({ results: data.results || [] })
  } catch {
    return Response.json({ results: [] })
  }
}
