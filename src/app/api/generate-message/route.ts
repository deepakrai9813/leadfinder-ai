import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessType, serviceType, customNotes, tone, userProfile, messageType } = body;

    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const services: Record<string, string> = {
      website_building: 'Professional Website Design & Development',
      website_management: 'Website Management & Maintenance',
      ai_agent_creation: 'AI Agent Creation & Integration',
      all: 'Complete Digital Solutions (Website + Management + AI)',
    };

    const serviceName = services[serviceType as keyof typeof services] || 'Digital Services';
    const isWhatsApp = messageType === 'whatsapp';

    const profileInfo = userProfile
      ? `\n\nAbout us: ${userProfile.companyDesc || userProfile.serviceName || 'We are a digital services company.'}\nOur contact: ${userProfile.yourPhone ? userProfile.yourPhone + ', ' : ''}${userProfile.yourEmail || 'available on request'}\nWebsite: ${userProfile.yourWebsite || 'N/A'}`
      : '';

    const systemPrompt = isWhatsApp
      ? `You are an expert WhatsApp marketer who writes cold outreach messages for digital services.
Rules:
- Write a SHORT WhatsApp message (60-120 words max)
- Start with a friendly greeting
- Keep it conversational, not formal
- Mention the service clearly but briefly
- Include a clear call-to-action
- Use simple language, avoid jargon
- No subject line needed - just the message body
- Make it feel personal, not like spam
- End with your sender info placeholder: [Your Name] from [Company]
${tone === 'friendly' ? '- Use warm, emoji-friendly tone' : tone === 'formal' ? '- Use a respectful tone' : '- Use balanced professional tone'}`
      : `You are an expert sales copywriter who specializes in cold outreach emails for digital services. 
Write a compelling, professional outreach email to a business that doesn't have a proper website.

Rules:
- Keep it concise but persuasive (100-200 words)
- Personalize for the specific business
- Highlight the benefits of having a professional online presence
- Include a clear call-to-action
- Don't sound desperate or pushy
- Make it feel like a genuine business recommendation
${tone === 'friendly' ? '- Use a warm, conversational tone' : tone === 'formal' ? '- Use a formal, professional tone' : '- Use a balanced professional tone'}
- Generate the message body only (no "Subject:" prefix in body)
- Also generate a compelling subject line`;

    const userPrompt = isWhatsApp
      ? `Write a WhatsApp message for this business:

Business Name: ${businessName}
Business Type: ${businessType || 'General Business'}
Service Being Offered: ${serviceName}
${customNotes ? `Extra context: ${customNotes}` : ''}${profileInfo}

Generate a short, engaging WhatsApp outreach message about ${serviceName.toLowerCase()}. Make it feel like a genuine personal recommendation.`
      : `Business Name: ${businessName}
Business Type: ${businessType || 'General Business'}
Service Being Offered: ${serviceName}
${customNotes ? `Additional context: ${customNotes}` : ''}${profileInfo}

Generate a personalized outreach email for this business about ${serviceName.toLowerCase()}.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawContent = completion?.choices?.[0]?.message?.content || '';

    let subject = '';
    let messageBody = rawContent;

    if (!isWhatsApp) {
      // Try to extract subject line
      const subjectMatch = rawContent.match(/(?:Subject:\s*|SUBJECT:\s*)(.+)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        messageBody = rawContent.replace(/(?:Subject:\s*|SUBJECT:\s*).+\n*/i, '').trim();
      } else {
        subject = `${businessName} Deserves a Professional Online Presence`;
      }
    }

    return NextResponse.json({
      subject,
      content: messageBody,
      serviceType,
      messageType: isWhatsApp ? 'whatsapp' : 'email',
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error('Generate message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate message' },
      { status: 500 }
    );
  }
}
