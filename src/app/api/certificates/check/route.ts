import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const competitionId = searchParams.get('competitionId');

    if (!studentId || !competitionId) {
      return NextResponse.json(
        { success: false, message: 'Student ID and Competition ID are required' },
        { status: 400 }
      );
    }

    const certificatePath = path.join(process.cwd(), 'public', 'Certificate-Generator', 'Cer-Generated', `${studentId}_${competitionId}.png`);
    const exists = fs.existsSync(certificatePath);

    return NextResponse.json({ 
      success: true, 
      exists,
      path: exists ? `/Certificate-Generator/Cer-Generated/${studentId}_${competitionId}.png` : null
    });

  } catch (error) {
    console.error('Error checking certificate:', error);
    return NextResponse.json(
      { success: false, message: 'Error checking certificate' },
      { status: 500 }
    );
  }
} 