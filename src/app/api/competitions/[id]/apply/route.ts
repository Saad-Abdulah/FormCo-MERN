import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/database';
import Competition from '@/lib/models/Competition';
import Application from '@/lib/models/Application';
import Student from '@/lib/models/Student';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can apply for competitions' }, { status: 403 });
    }

    await connectToDatabase();

    // Get the competition
    const competition = await Competition.findById(params.id);
    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Check if competition is open
    if (competition.deadlineToApply && new Date(competition.deadlineToApply) <= new Date()) {
      return NextResponse.json({ error: 'Competition is not open for applications' }, { status: 400 });
    }

    // Check if deadline has passed
    if (new Date() > new Date(competition.deadlineToApply)) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Get the student
    const student = await Student.findById(session.user.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      competition: competition._id,
      student: student._id,
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied for this competition' }, { status: 400 });
    }

    // Get application data from request
    const formData = await request.formData();
    const data: any = {};
    
    // Extract form fields
    for (const [key, value] of formData.entries()) {
      if (key === 'teamMembers') {
        data[key] = JSON.parse(value as string);
      } else if (key === 'receiptImage') {
        // Handle file upload
        const file = value as File;
        if (file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Create unique filename
          const filename = `receipt_${Date.now()}_${file.name}`;
          const filepath = path.join(process.cwd(), 'public', 'receipts', filename);
          
          // Save file
          await writeFile(filepath, buffer);
          data.receiptImage = `/receipts/${filename}`;
        }
      } else {
        data[key] = value;
      }
    }

    let applicationData: any = {
      competition: competition._id,
      student: student._id,
    };

    // Handle team events
    if (competition.isTeamEvent) {
      // Validate team name
      if (!data.teamName) {
        return NextResponse.json({ error: 'Team name is required for team events' }, { status: 400 });
      }

      // Validate team members array
      if (!competition.teamSize) {
        return NextResponse.json({ error: 'Team size configuration not found' }, { status: 400 });
      }

      if (!data.teamMembers || !Array.isArray(data.teamMembers) || 
          data.teamMembers.length < competition.teamSize.min || 
          data.teamMembers.length > competition.teamSize.max) {
        return NextResponse.json({
          error: `Team must have ${competition.teamSize.min} to ${competition.teamSize.max} members`,
        }, { status: 400 });
      }

      // Validate each team member has required fields
      for (let i = 0; i < data.teamMembers.length; i++) {
        const member = data.teamMembers[i];
        const missingFields = competition.requiredApplicationFields.filter(
          field => !member[field] || member[field].trim() === ''
        );

        if (missingFields.length > 0) {
          return NextResponse.json({
            error: `Team member ${i + 1} is missing required fields: ${missingFields.join(', ')}`,
          }, { status: 400 });
        }
      }

      // For team events, store team information
      applicationData = {
        ...applicationData,
        teamName: data.teamName,
        teamMembers: data.teamMembers,
      };

    } else {
      // Handle individual events
      // Validate required fields for individual application
      const missingFields = competition.requiredApplicationFields.filter(
        field => !data[field] || data[field].trim() === ''
      );

      if (missingFields.length > 0) {
        return NextResponse.json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
        }, { status: 400 });
      }

      // For individual events, store as single team member
      applicationData = {
        ...applicationData,
        teamMembers: [{
          name: data.name,
          email: data.email,
          institute: data.institute,
          contact: data.contact,
          qualification: data.qualification,
          resume: data.resume,
        }],
      };
    }

    // Add payment fields if present
    if (data.receiptImage) {
      applicationData.receiptImage = data.receiptImage;
    }
    if (data.transactionId) {
      applicationData.transactionId = data.transactionId;
    }

    // Create the application
    const application = await Application.create(applicationData);

    return NextResponse.json({
      message: 'Application submitted successfully',
      application,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting application:', error);
    return NextResponse.json({
      error: error.message || 'Failed to submit application',
    }, { status: 500 });
  }
} 