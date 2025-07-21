import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/database';
import Organization from '@/lib/models/Organization';
import Organizer from '@/lib/models/Organizer';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Join Organization Request Start ===');
    
    // Get session to verify organizer
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'organizer') {
      console.log('Unauthorized: Invalid session or role');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    console.log('Database connected successfully');

    const { secretCode } = await request.json();
    console.log('Secret code received:', secretCode);

    if (!secretCode) {
      return NextResponse.json(
        { error: 'Secret code is required' },
        { status: 400 }
      );
    }

    // Find organization by secret code
    const organization = await Organization.findOne({ secretCode });
    if (!organization) {
      console.log('Organization not found with secret code');
      return NextResponse.json(
        { error: 'Invalid secret code' },
        { status: 400 }
      );
    }

    console.log('Organization found:', organization.name);

    // Find the organizer
    const organizer = await Organizer.findById(session.user.id);
    if (!organizer) {
      console.log('Organizer not found');
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      );
    }

    // Check if organizer is already in the list
    const isAlreadyAuthorized = organization.authorizedOrganizers.includes(organizer._id);
    if (isAlreadyAuthorized) {
      console.log('Organizer already authorized for this organization');
      return NextResponse.json(
        { error: 'You are already authorized for this organization' },
        { status: 400 }
      );
    }

    // Add organizer to authorized list
    organization.authorizedOrganizers.push(organizer._id);
    organizer.organizations.push(organization._id);
    await organizer.save();
    await organization.save();

    console.log('Organizer added to organization successfully');

    return NextResponse.json(
      { 
        message: 'Successfully joined organization',
        organizationName: organization.name
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('=== Join Organization Error ===');
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 