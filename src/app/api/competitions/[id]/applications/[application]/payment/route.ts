import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/database';
import Competition from '@/lib/models/Competition';
import Application from '@/lib/models/Application';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; application: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'organizer' && session.user.role !== 'organization') {
      return NextResponse.json({ error: 'Only organizers can update payment status' }, { status: 403 });
    }

    await connectToDatabase();

    // Get the competition and verify access
    const competition = await Competition.findById(params.id);
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Check if user has access to this competition
    if (session.user.role === 'organizer' && competition.organizer?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (session.user.role === 'organization' && competition.organization?.toString() !== session.user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the payment verification status from request
    const { paymentVerified } = await request.json();

    if (typeof paymentVerified !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payment verification status' }, { status: 400 });
    }

    // Update the application's payment verification status
    const application = await Application.findByIdAndUpdate(
      params.application,
      { 
        paymentVerified,
        paymentDate: paymentVerified ? new Date() : undefined
      },
      { new: true }
    );

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify the application belongs to this competition
    if (application.competition.toString() !== params.id) {
      return NextResponse.json({ error: 'Application does not belong to this competition' }, { status: 400 });
    }

    return NextResponse.json({
      message: `Payment ${paymentVerified ? 'verified' : 'marked as pending'}`,
      paymentVerified: application.paymentVerified,
      paymentDate: application.paymentDate
    });

  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update payment status',
    }, { status: 500 });
  }
} 