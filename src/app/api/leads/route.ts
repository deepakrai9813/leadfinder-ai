import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const leads = await db.businessLead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        outreachMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, businessType, address, phone, email, website, hasWebsite, websiteStatus, source, searchQuery, notes } = body;

    // Check if lead already exists
    const existing = await db.businessLead.findFirst({
      where: { businessName: businessName },
    });

    if (existing) {
      // Update existing lead with new info
      const updated = await db.businessLead.update({
        where: { id: existing.id },
        data: {
          businessType: businessType || existing.businessType,
          address: address || existing.address,
          phone: phone || existing.phone,
          email: email || existing.email,
          website: website || existing.website,
          hasWebsite: hasWebsite !== undefined ? hasWebsite : existing.hasWebsite,
          websiteStatus: websiteStatus || existing.websiteStatus,
          source: source || existing.source,
          searchQuery: searchQuery || existing.searchQuery,
          notes: notes ? (existing.notes ? existing.notes + '\n' + notes : notes) : existing.notes,
        },
        include: { outreachMessages: true },
      });

      return NextResponse.json({ lead: updated, isNew: false });
    }

    const lead = await db.businessLead.create({
      data: {
        businessName,
        businessType,
        address,
        phone,
        email,
        website,
        hasWebsite: hasWebsite || false,
        websiteStatus: websiteStatus || 'unknown',
        source,
        searchQuery,
        notes,
      },
      include: { outreachMessages: true },
    });

    return NextResponse.json({ lead, isNew: true });
  } catch (error: any) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await db.businessLead.update({
      where: { id },
      data,
      include: { outreachMessages: true },
    });

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    await db.businessLead.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
