import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/database';
import Student from '@/lib/models/Student';
import Organization from '@/lib/models/Organization';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Student Registration Start ===');
    await connectDB();
    console.log('Database connected successfully');
    
    const requestBody = await request.json();
    console.log('Request body received:', requestBody);
    
    const { 
      name, 
      email, 
      password, 
      phone, 
      organizationId, 
      educationLevel, 
      yearOrSemester, 
      country 
    } = requestBody;

    // Validate required fields
    console.log('Validating required fields:', {
      name: !!name,
      email: !!email,
      password: !!password,
      organizationId: !!organizationId,
      educationLevel: !!educationLevel,
      yearOrSemester: !!yearOrSemester,
      country: !!country
    });
    
    if (!name || !email || !password || !educationLevel || !yearOrSemester || !country) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }
    console.log('Validation passed');

    // Check if student already exists
    console.log('Checking for existing student with email:', email);
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      console.log('Student already exists with this email');
      return NextResponse.json(
        { error: 'A student with this email already exists' },
        { status: 400 }
      );
    }
    console.log('No existing student found');

    // If organizationId is provided, verify organization exists
    let organization = null;
    if (organizationId) {
      console.log('Looking up organization with ID:', organizationId);
      organization = await Organization.findById(organizationId);
      if (!organization) {
        console.log('Organization not found');
        return NextResponse.json(
          { error: 'Selected organization not found' },
          { status: 400 }
        );
      }
      console.log('Organization found:', organization.name);
      // Optionally, check verification here
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Create new student
    const studentData: any = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone?.trim() || '',
      educationLevel,
      yearOrSemester: yearOrSemester.trim(),
      country: country.trim(),
      isGoogleAuth: false,
    };
    if (organizationId) {
      studentData.organizationId = organizationId;
    }
    
    console.log('Creating student with data:', {
      ...studentData,
      password: '[HIDDEN]'
    });
    
    const student = new Student(studentData);
    console.log('Student document created, saving to database...');
    await student.save();
    console.log('Student saved successfully with ID:', student._id);

    console.log('=== Student Registration Success ===');
    return NextResponse.json(
      { 
        message: 'Student account created successfully',
        studentId: student._id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('=== Student Registration Error ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 