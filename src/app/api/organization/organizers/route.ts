import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Support fetching by id param for all roles
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');
    let organization;
    if (orgId) {
      organization = await Organization.findById(orgId)
        .populate('authorizedOrganizers', 'name email department position isApproved');
    } else if (session.user.role === 'organization') {
      organization = await Organization.findById(session.user.id)
        .populate('authorizedOrganizers', 'name email department position isApproved');
    } else {
      return NextResponse.json(
        { error: 'Organization id required' },
        { status: 400 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organizers: organization.authorizedOrganizers
    });

  } catch (error) {
    console.error('Error fetching organizers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 