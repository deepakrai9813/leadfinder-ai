import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset OTP has been generated.',
      });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP(6)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store the OTP as a verification token
    // Delete any existing tokens for this email first
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    })

    await db.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires: expiresAt,
      },
    })

    // In production, you would send this OTP via email/SMS
    // For this demo, we return it so the user can test
    return NextResponse.json({
      success: true,
      message: 'OTP generated successfully',
      // In production, remove this - only send via email/SMS
      otp,
      hint: `Demo OTP: ${otp} (valid for 15 min)`,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
