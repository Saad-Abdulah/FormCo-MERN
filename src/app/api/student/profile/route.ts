import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/database';
import Student from '@/lib/models/Student';

export async function PUT(request: NextRequest) {
  try {
    console.log('=== Student Profile Update Start ===');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session || session.user.role !== 'student') {
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
    
    const { name, phone, educationLevel } = requestBody;

    console.log('Updating student with ID:', session.user.id);
    console.log('Update data:', { name, phone, educationLevel });

    // Validate education level
    const validEducationLevels = ['high-school', 'college', 'higher-ed'];
    if (educationLevel && !validEducationLevels.includes(educationLevel)) {
      console.log('Invalid education level:', educationLevel);
      return NextResponse.json(
        { error: 'Invalid education level' },
        { status: 400 }
      );
    }

    // Find and update the student
    const student = await Student.findByIdAndUpdate(
      session.user.id,
      {
        name: name?.trim(),
        phone: phone?.trim() || undefined,
        educationLevel: educationLevel || undefined,
      },
      { new: true, runValidators: true }
    ).populate('organizationId');

    console.log('Update result:', student);

    if (!student) {
      console.log('Student not found');
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    console.log('=== Student Profile Update Success ===');
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: student.name,
        phone: student.phone,
        educationLevel: student.educationLevel,
        organization: student.organizationId?.name,
      }
    });

  } catch (error) {
    console.error('=== Student Profile Update Error ===');
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

export async function PATCH(request: NextRequest) {
  try {
    console.log('=== Student Profile PATCH Start ===');
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const requestBody = await request.json();
    const { organizationId } = requestBody;
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }
    const student = await Student.findByIdAndUpdate(
      session.user.id,
      { organizationId },
      { new: true, runValidators: true }
    ).populate('organizationId');
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({
      message: 'Organization updated successfully',
      user: {
        name: student.name,
        organization: student.organizationId,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 