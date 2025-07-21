import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/database';
import Organization from '@/lib/models/Organization';
import Organizer from '@/lib/models/Organizer';

export async function GET(request: NextRequest) {
  try {
    // Get session to verify organizer
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'organizer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    const organizer = await Organizer.findById(session.user.id).populate('organizations');

    if (!organizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 });
    }

    return NextResponse.json({ organizations: organizer.organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 