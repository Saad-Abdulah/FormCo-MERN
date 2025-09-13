import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database';
import Organizer from '@/lib/models/Organizer';

export async function PUT(request: NextRequest) {
  try {
    console.log('=== Organizer Profile Update Start ===');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session || session.user.role !== 'organizer') {
      console.log('Unauthorized: Invalid session or role');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const { name, phone, department, position } = requestBody;

    console.log('Updating organizer with ID:', session.user.id);
    console.log('Update data:', { name, phone, department, position });

    // Find and update the organizer
    const organizer = await Organizer.findByIdAndUpdate(
      session.user.id,
      {
        name: name?.trim(),
        phone: phone?.trim() || undefined,
        department: department?.trim() || undefined,
        position: position?.trim() || undefined,
      },
      { new: true, runValidators: true }
    );

    console.log('Update result:', organizer);

    if (!organizer) {
      console.log('Organizer not found');
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      );
    }

    console.log('=== Organizer Profile Update Success ===');
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: organizer.name,
        phone: organizer.phone,
        department: organizer.department,
        position: organizer.position,
      }
    });

  } catch (error) {
    console.error('=== Organizer Profile Update Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 