import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Find organization
    let organization;
    try {
      organization = await Organization.findById(params.id)
        .select('name website logo') // Only select necessary fields
        .lean();
    } catch (error) {
      console.error('Error finding organization:', error);
      return NextResponse.json(
        { error: 'Error finding organization', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Make sure website field exists even if null
    const sanitizedOrg = {
      ...organization,
      website: organization.website || null
    };

    return NextResponse.json({ 
      organization: sanitizedOrg
    });
  } catch (error) {
    console.error('Error in organization API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 