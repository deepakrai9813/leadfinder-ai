import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, businessType } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Build search queries to find businesses without websites
    const searchQueries = [
      `${query} ${location || ''} businesses contact information`.trim(),
      `${query} ${location || ''} ${businessType || ''} companies directory listing`.trim(),
      `${query} ${location || ''} ${businessType || ''} - site:.com - site:.org contact`.trim(),
    ].filter(q => q.length > 5);

    const allResults: any[] = [];

    for (const searchQuery of searchQueries) {
      try {
        const results = await zai.functions.invoke('web_search', {
          query: searchQuery,
          num: 15,
        });

        if (results && results.length > 0) {
          allResults.push(...results.map((r: any) => ({
            name: r.name,
            snippet: r.snippet,
            url: r.url,
            hostName: r.host_name,
            rank: r.rank,
          })));
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }

    // Deduplicate results by name
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
    );

    // Save search history
    await db.searchHistory.create({
      data: {
        query: query,
        location: location,
        businessType: businessType,
        resultsCount: uniqueResults.length,
      },
    });

    return NextResponse.json({
      results: uniqueResults,
      count: uniqueResults.length,
      queries: searchQueries,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search businesses' },
      { status: 500 }
    );
  }
}
