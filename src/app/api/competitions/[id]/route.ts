import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Competition from '@/lib/models/Competition';
import { connectToDatabase } from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const competition = await Competition.findById(params.id)
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