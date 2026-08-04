import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let profile = await db.userProfile.findFirst();
    if (!profile) {
      profile = await db.userProfile.create({ data: {} });
    }
    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let profile = await db.userProfile.findFirst();
    if (profile) {
      profile = await db.userProfile.update({
        where: { id: profile.id },
        data: body,
      });
    } else {
      profile = await db.userProfile.create({ data: body });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Save profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save profile' },
      { status: 500 }
    );
  }
}
