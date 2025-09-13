import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'organization') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { organizerId } = await request.json();

    if (!organizerId) {
      return NextResponse.json(
        { error: 'Organizer ID is required' },
        { status: 400 }
      );
    }

    // Find the organization and remove the organizer
    const organization = await Organization.findById(session.user.id);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organizer is in the authorized list
    const organizerIndex = organization.authorizedOrganizers.indexOf(organizerId);
    if (organizerIndex === -1) {
      return NextResponse.json(
        { error: 'Organizer not found in organization' },
        { status: 400 }
      );
    }

    // Remove the organizer
    organization.authorizedOrganizers.splice(organizerIndex, 1);
    await organization.save();

    return NextResponse.json({
      message: 'Organizer removed successfully'
    });

  } catch (error) {
    console.error('Error removing organizer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 