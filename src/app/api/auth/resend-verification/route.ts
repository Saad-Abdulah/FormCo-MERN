import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find organization
    const organization = await Organization.findOne({ email: email.toLowerCase() });
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

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update organization
    organization.emailVerificationCode = verificationCode;
    organization.emailVerificationExpiry = verificationExpiry;
    await organization.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode, organization.name);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification code sent successfully. Please check your email.',
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 