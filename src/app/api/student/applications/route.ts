import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from '@/lib/database';
import Application from '@/lib/models/Application';
import Student from '@/lib/models/Student';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view their applications' }, { status: 403 });
    }

    await connectToDatabase();

    // Get the student
    const student = await Student.findById(session.user.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch all applications for this student
    const applications = await Application.find({
      student: student._id,
    })
    .populate('competition', 'title _id registrationFee')
    .sort({ createdAt: -1 });

    // Format the response to include only necessary data
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      competitionId: app.competition._id,
      competitionTitle: app.competition.title,
      verificationCode: app.verificationCode,
      paymentVerified: app.paymentVerified,
      registrationFee: app.competition.registrationFee,
      createdAt: app.createdAt,
    }));

    return NextResponse.json({
      applications: formattedApplications
    });

  } catch (error: any) {
    console.error('Error fetching student applications:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch applications',
    }, { status: 500 });
  }
} 