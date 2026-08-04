import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessUrl } = body;

    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Step 1: Search specifically for this business's website
    const websiteSearchQuery = `"${businessName}" official website`;
    let websiteUrl: string | null = null;
    let hasWebsite = false;
    let websiteStatus = 'unknown';

    try {
      const websiteResults = await zai.functions.invoke('web_search', {
        query: websiteSearchQuery,
        num: 5,
      });

      if (websiteResults && websiteResults.length > 0) {
        // Look for official website in results
        const officialResult = websiteResults.find((r: any) =>
          r.name.toLowerCase().includes(businessName.toLowerCase()) &&
          !r.host_name.includes('facebook') &&
          !r.host_name.includes('instagram') &&
          !r.host_name.includes('twitter') &&
          !r.host_name.includes('linkedin') &&
          !r.host_name.includes('yelp') &&
          !r.host_name.includes('google') &&
          !r.host_name.includes('yellowpages') &&
          !r.host_name.includes('justdial') &&
          !r.host_name.includes('indiamart')
        );

        if (officialResult) {
          websiteUrl = officialResult.url;
          hasWebsite = true;
          websiteStatus = 'has_website';
        }
      }
    } catch (err) {
      console.error('Website search error:', err);
    }

    // Step 2: If no dedicated website found, check if they have only social media presence
    if (!hasWebsite) {
      const socialCheckQuery = `"${businessName}" facebook OR instagram OR linkedin`;
      try {
        const socialResults = await zai.functions.invoke('web_search', {
          query: socialCheckQuery,
          num: 5,
        });

        if (socialResults && socialResults.length > 0) {
          const hasSocialOnly = socialResults.every((r: any) =>
            r.host_name.includes('facebook') ||
            r.host_name.includes('instagram') ||
            r.host_name.includes('twitter') ||
            r.host_name.includes('linkedin') ||
            r.host_name.includes('whatsapp')
          );
          websiteStatus = hasSocialOnly ? 'no_website' : 'unknown';
        } else {
          websiteStatus = 'no_website';
        }
      } catch (err) {
        console.error('Social check error:', err);
      }
    }

    // Step 3: Try to read their website page if found, to assess quality
    let websiteQuality = '';
    if (hasWebsite && websiteUrl) {
      try {
        const pageData = await zai.functions.invoke('page_reader', {
          url: websiteUrl,
        });

        if (pageData && pageData.data) {
          const htmlLength = pageData.data.html?.length || 0;
          if (htmlLength < 500) {
            websiteStatus = 'poor_website';
          }

          // Use AI to evaluate the website quality
          const evaluation = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: `You are a website quality evaluator. Analyze the given HTML content and determine if this is a professional, functional business website. Check for: proper navigation, contact info, services/products listed, mobile responsiveness indicators. Return JSON with: {"is_professional": boolean, "issues": string[], "score": number 1-10}`
              },
              {
                role: 'user',
                content: `Business: ${businessName}\nURL: ${websiteUrl}\nHTML Preview (first 3000 chars): ${pageData.data.html?.substring(0, 3000)}`
              }
            ],
          });

          try {
            const evalContent = evaluation?.choices?.[0]?.message?.content || '';
            const jsonMatch = evalContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const evalJson = JSON.parse(jsonMatch[0]);
              if (evalJson.score && evalJson.score < 4) {
                websiteStatus = 'poor_website';
                websiteQuality = evalJson.issues?.join(', ') || '';
              }
            }
          } catch (parseErr) {
            console.error('Evaluation parse error:', parseErr);
          }
        }
      } catch (readErr) {
        console.error('Page read error:', readErr);
        if (hasWebsite) {
          websiteStatus = 'poor_website';
        }
      }
    }

    return NextResponse.json({
      businessName,
      websiteUrl,
      hasWebsite,
      websiteStatus, // unknown, has_website, no_website, poor_website
      websiteQuality,
      needsServices: websiteStatus === 'no_website' || websiteStatus === 'poor_website' || websiteStatus === 'unknown',
    });
  } catch (error: any) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze business' },
      { status: 500 }
    );
  }
}
