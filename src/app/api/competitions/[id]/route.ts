import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import Competition from '@/lib/models/Competition';
import { connectToDatabase } from '@/lib/database';
import Application from '@/lib/models/Application';
import TeamRegistration from '@/lib/models/TeamRegistration';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id: competitionId } = await params;

    const competition = await Competition.findById(competitionId)
      .populate('organization', 'name logo')
      .populate('organizer', 'name position');

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    return NextResponse.json({ competition });
  } catch (error: any) {
    console.error('Error fetching competition:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch competition' 
    }, { status: 500 });
  }
} 

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['organizer', 'organization'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    
    const { id: competitionId } = await params;
    
    // Delete all applications for this competition
    await Application.deleteMany({ competition: competitionId });
    // Delete all team registrations for this competition
    await TeamRegistration.deleteMany({ competition: competitionId });
    // Delete the competition itself
    const deleted = await Competition.findByIdAndDelete(competitionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting competition:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete competition' }, { status: 500 });
  }
} 