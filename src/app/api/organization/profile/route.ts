import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database';
import Organization from '@/lib/models/Organization';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'organization') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    await connectToDatabase();
    const requestBody = await request.json();
    const { name, website, logo } = requestBody;
    // Update organization, including logo if provided
    const updateData: any = {
      name: name?.trim(),
      website: website?.trim() || undefined,
    };
    if (logo) updateData.logo = logo;
    const organization = await Organization.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: organization.name,
        website: organization.website,
        logo: organization.logo,
        secretCode: organization.secretCode,
        createdAt: organization.createdAt,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 