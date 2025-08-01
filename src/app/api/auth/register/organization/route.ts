import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';
// import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Starting organization registration...');
    
    await connectDB();
    console.log('✅ Database connected');
    
    const { name, email, password, website, logo } = await request.json();
    console.log('📝 Received data:', { name, email, website, logo: logo ? 'provided' : 'not provided' });

    // Validate required fields
    if (!name || !email || !password) {
      console.log('❌ Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if organization already exists
    console.log('🔍 Checking for existing organization...');
    const existingOrg = await Organization.findOne({ email: email.toLowerCase() });
    if (existingOrg) {
      console.log('❌ Organization already exists');
      return NextResponse.json(
        { error: 'Organization with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate secret code explicitly
    console.log('🎲 Generating secret code...');
    const secretCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log('✅ Secret code generated:', secretCode);

    // Create organization (without email verification for testing)
    console.log('🏢 Creating organization...');
    const organization = new Organization({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      website,
      logo: logo || undefined,
      isEmailVerified: true, // Set to true for testing (skip email verification)
      secretCode, // Explicitly set the secret code
    });

    console.log('💾 Saving organization to database...');
    await organization.save();
    console.log('✅ Organization saved successfully');

    console.log('🎉 Registration completed successfully');
    return NextResponse.json({
      message: 'Organization registered successfully!',
      organizationId: organization._id,
      secretCode: organization.secretCode,
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Organization registration error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check for specific MongoDB errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      console.error('Duplicate key error:', 'keyPattern' in error ? error.keyPattern : 'unknown');
      return NextResponse.json(
        { error: 'Organization with this email or secret code already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 