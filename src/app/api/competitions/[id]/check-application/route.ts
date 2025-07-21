import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/database';
import Application from '@/lib/models/Application';
import Student from '@/lib/models/Student';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can check applications' }, { status: 403 });
    }

    await connectToDatabase();

    // Get the student
    const student = await Student.findById(session.user.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      competition: params.id,
      student: student._id,
    });

    if (existingApplication) {
      return NextResponse.json({
        hasApplied: true,
        application: {
          _id: existingApplication._id,
          verificationCode: existingApplication.verificationCode,
          createdAt: existingApplication.createdAt,
          paymentVerified: existingApplication.paymentVerified,
        }
      });
    } else {
      return NextResponse.json({
        hasApplied: false,
        application: null
      });
    }

  } catch (error: any) {
    console.error('Error checking application:', error);
    return NextResponse.json({
      error: error.message || 'Failed to check application status',
    }, { status: 500 });
  }
} 