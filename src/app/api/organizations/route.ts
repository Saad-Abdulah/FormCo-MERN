import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get only verified organizations for public listing
    const organizations = await Organization.find(
      { isEmailVerified: true },
      'name logo website createdAt'
    ).sort({ name: 1 });

    return NextResponse.json({
      organizations: organizations.map(org => ({
        id: org._id.toString(),
        name: org.name,
        logo: org.logo,
        website: org.website,
        createdAt: org.createdAt,
      })),
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 