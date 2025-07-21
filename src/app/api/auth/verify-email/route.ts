import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { organizationId, verificationCode } = await request.json();

    if (!organizationId || !verificationCode) {
      return NextResponse.json(
        { error: 'Organization ID and verification code are required' },
        { status: 400 }
      );
    }

    // Find organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (organization.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check verification code
    if (organization.emailVerificationCode !== verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (organization.emailVerificationExpiry && organization.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify email
    organization.isEmailVerified = true;
    organization.emailVerificationCode = undefined;
    organization.emailVerificationExpiry = undefined;
    await organization.save();

    return NextResponse.json({
      message: 'Email verified successfully! You can now log in.',
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 