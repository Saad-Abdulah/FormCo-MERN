import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/database';
import Competition from '@/lib/models/Competition';
import Application from '@/lib/models/Application';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; application: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow all authenticated users to view applications for now (for testing)
    if (session.user.role !== 'organizer' && session.user.role !== 'organization' && session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    await connectToDatabase();

    // Get the competition and verify access
    const competition = await Competition.findById(params.id)
      .populate('organization', 'name logo')
      .populate('organizer', 'name position');
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Temporarily disable strict access control for testing
    // TODO: Re-enable this once the access control is properly set up
    /*
    // Check if user has access to this competition based on role
    if (session.user.role === 'organizer') {
      // For organizers, check if they are the organizer of this competition OR if they belong to the organization that owns this competition
      const isOrganizerOfCompetition = competition.organizer?._id?.toString() === session.user.id;
      const belongsToOrganization = competition.organization?._id?.toString() === session.user.organizationId;
      
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

    // Fetch the specific application
    const application = await Application.findById(params.application)
      .populate('student', 'name email')
      .populate('competition', 'title isTeamEvent registrationFee requiredApplicationFields');

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify the application belongs to this competition
    if (application.competition._id.toString() !== params.id) {
      return NextResponse.json({ error: 'Application does not belong to this competition' }, { status: 400 });
    }

    // If user is a student, verify they can only view their own application
    if (session.user.role === 'student' && application.student._id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'You can only view your own applications' }, { status: 403 });
    }

    return NextResponse.json({
      application,
      competition: {
        _id: competition._id,
        title: competition.title,
        isTeamEvent: competition.isTeamEvent,
        registrationFee: competition.registrationFee,
        requiredApplicationFields: competition.requiredApplicationFields,
        event: competition.event,
        startDate: competition.startDate,
        endDate: competition.endDate,
        organization: competition.organization,
        organizer: competition.organizer,
      }
    });

  } catch (error: any) {
    console.error('Error fetching application details:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch application details',
    }, { status: 500 });
  }
} 

export async function PATCH(request: NextRequest, { params }: { params: { id: string; application: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'organizer' && session.user.role !== 'organization')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const body = await request.json();
    const update: any = {};
    if ('attended' in body) update.attended = body.attended;
    if ('accepted' in body) update.accepted = body.accepted;
    const application = await Application.findByIdAndUpdate(
      params.application,
      update,
      { new: true }
    );
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: error.message || 'Failed to update application' }, { status: 500 });
  }
} 