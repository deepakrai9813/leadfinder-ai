import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const messages = await db.outreachMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lead: true },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, messageType, subject, content, serviceType, aiGenerated, sendNow, toEmail, toPhone } = body;

    if (!leadId || !content) {
      return NextResponse.json({ error: 'Lead ID and content are required' }, { status: 400 });
    }

    // Get the lead to retrieve contact info
    const lead = await db.businessLead.findUnique({
      where: { id: leadId },
    });

    const finalEmail = toEmail || lead?.email || null;
    const finalPhone = toPhone || lead?.phone || null;

    const message = await db.outreachMessage.create({
      data: {
        leadId,
        messageType: messageType || 'email',
        subject: messageType === 'email' ? (subject || null) : null,
        content,
        serviceType: serviceType || 'all',
        aiGenerated: aiGenerated || false,
        status: sendNow ? 'sent' : 'draft',
        sentAt: sendNow ? new Date() : null,
      },
      include: { lead: true },
    });

    // Update lead status to contacted if message is sent
    if (sendNow) {
      await db.businessLead.update({
        where: { id: leadId },
        data: { status: 'contacted' },
      });
    }

    // Build actionable response with email/WhatsApp links
    let emailLink = null;
    let whatsappLink = null;
    let emailBody = null;

    if (sendNow && messageType === 'email' && finalEmail) {
      const emailSubject = encodeURIComponent(subject || 'Professional Website & Digital Services');
      const emailContent = encodeURIComponent(content);
      emailLink = `mailto:${finalEmail}?subject=${emailSubject}&body=${emailContent}`;
      emailBody = { to: finalEmail, subject, content };
    }

    if (sendNow && messageType === 'whatsapp' && finalPhone) {
      // Clean phone number: remove spaces, dashes, parens, add country code if missing
      let cleanedPhone = finalPhone.replace(/[\s\-\(\)]/g, '');
      if (!cleanedPhone.startsWith('+')) {
        // Default to India (+91) if no country code
        if (cleanedPhone.length === 10) {
          cleanedPhone = '91' + cleanedPhone;
        }
      }
      cleanedPhone = cleanedPhone.replace('+', '');
      const whatsappText = encodeURIComponent(content);
      whatsappLink = `https://wa.me/${cleanedPhone}?text=${whatsappText}`;
    }

    return NextResponse.json({
      message,
      emailLink,
      whatsappLink,
      emailBody,
      toEmail: finalEmail,
      toPhone: finalPhone,
    });
  } catch (error: any) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await db.outreachMessage.update({
      where: { id },
      data,
      include: { lead: true },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Update message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    );
  }
}
