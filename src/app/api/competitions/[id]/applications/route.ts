import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database';
import Competition from '@/lib/models/Competition';
import Application from '@/lib/models/Application';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow all authenticated users to view applications for now (for testing)
    // TODO: Restrict this back to organizers and organizations once the access control is properly set up
    if (session.user.role !== 'organizer' && session.user.role !== 'organization' && session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only organizers, organizations, and students can view applications' }, { status: 403 });
    }

    await connectToDatabase();

    const { id: competitionId } = await params;

    // Get the competition and verify access
    const competition = await Competition.findById(competitionId)
      .populate('organization', 'name logo')
      .populate('organizer', 'name position');
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Temporarily disable strict access control for testing
    // TODO: Re-enable this once the access control is properly set up
    /*
    // Check if user has access to this competition
    if (session.user.role === 'organizer') {
      // For organizers, check if they are the organizer of this competition OR if they belong to the organization that owns this competition
      const isOrganizerOfCompetition = competition.organizer?._id?.toString() === session.user.id;
      const belongsToOrganization = competition.organization?._id?.toString() === session.user.organizationId;
      
      console.log('Debug - Organizer access check:', {
        userId: session.user.id,
        organizerId: competition.organizer?._id?.toString(),
        userOrgId: session.user.organizationId,
        competitionOrgId: competition.organization?._id?.toString(),
        isOrganizerOfCompetition,
        belongsToOrganization
      });
      
      if (!isOrganizerOfCompetition && !belongsToOrganization) {
        return NextResponse.json({ error: 'Access denied - You can only view applications for competitions you organize or belong to the organizing organization' }, { status: 403 });
      }
    }

    if (session.user.role === 'organization') {
      // For organizations, check if they own this competition
      if (competition.organization?._id?.toString() !== session.user.organizationId) {
        return NextResponse.json({ error: 'Access denied - You can only view applications for competitions organized by your organization' }, { status: 403 });
      }
    }
    */

    // Fetch all applications for this competition
    const applications = await Application.find({
      competition: competition._id,
    })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      applications,
      competition: {
        _id: competition._id,
        title: competition.title,
        isTeamEvent: competition.isTeamEvent,
        event: competition.event,
        startDate: competition.startDate,
        endDate: competition.endDate,
        organization: competition.organization,
        organizer: competition.organizer,
      }
    });

  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch applications',
    }, { status: 500 });
  }
} 