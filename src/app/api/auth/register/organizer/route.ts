import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/database';
import Organizer from '@/lib/models/Organizer';
import Organization from '@/lib/models/Organization';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { 
      name, 
      email, 
      password, 
      phone, 
      department, 
      position,
      organizationSecretCode,
      isGoogleAuth = false,
      googleId,
      profilePicture
    } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // For non-Google auth, password is required
    if (!isGoogleAuth && !password) {
      return NextResponse.json(
        { error: 'Password is required for manual registration' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingOrganizer = await Organizer.findOne({ email: email.toLowerCase() });
    if (existingOrganizer) {
      return NextResponse.json(
        { error: 'Organizer with this email already exists' },
        { status: 400 }
      );
    }

    let organizationId;
    
    // If secret code is provided, verify it
    if (organizationSecretCode) {
      const organization = await Organization.findOne({ 
        secretCode: organizationSecretCode,
        isEmailVerified: true 
      });
      
      if (!organization) {
        return NextResponse.json(
          { error: 'Invalid organization secret code' },
          { status: 400 }
        );
      }
      
      organizationId = organization._id;
    }

    // Hash password if not Google auth
    let hashedPassword;
    if (!isGoogleAuth && password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create organizer
    const organizer = new Organizer({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      department,
      position,
      isGoogleAuth,
      googleId,
      profilePicture,
      isApproved: false, // Requires organization approval
      organizations: organizationId ? [organizationId] : [], // Use organizations array
    });

    await organizer.save();

    // Add organizer to organization's authorized list if secret code was used
    if (organizationId) {
      await Organization.findByIdAndUpdate(
        organizationId,
        { $addToSet: { authorizedOrganizers: organizer._id } }
      );
    }

    return NextResponse.json({
      message: organizationId 
        ? 'Organizer registered successfully. Waiting for organization approval.'
        : 'Organizer registered successfully. You can join an organization later using their secret code.',
      organizerId: organizer._id,
    }, { status: 201 });

  } catch (error) {
    console.error('Organizer registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 