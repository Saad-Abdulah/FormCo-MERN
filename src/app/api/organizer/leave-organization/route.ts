import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'organizer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Find the organization and remove the organizer
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organizer is in the authorized list
    const organizerIndex = organization.authorizedOrganizers.indexOf(session.user.id);
    if (organizerIndex === -1) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 400 }
      );
    }

    // Remove the organizer
    organization.authorizedOrganizers.splice(organizerIndex, 1);
    await organization.save();

    return NextResponse.json({
      message: 'Successfully left organization'
    });

  } catch (error) {
    console.error('Error leaving organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 