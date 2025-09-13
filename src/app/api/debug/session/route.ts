import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No session found' 
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        organizationId: session.user.organizationId,
        organization: session.user.organization,
        isApproved: session.user.isApproved,
      }
    });

  } catch (error: any) {
    console.error('Session debug error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to get session info',
    }, { status: 500 });
  }
} 