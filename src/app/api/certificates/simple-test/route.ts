import { NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('Simple certificate test started');

    // Create a simple canvas
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a simple border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Draw some text
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Test Certificate', canvas.width / 2, 100);
    ctx.fillText('Generated Successfully', canvas.width / 2, 150);
    ctx.fillText('Student: Test User', canvas.width / 2, 200);
    ctx.fillText('Competition: Test Event', canvas.width / 2, 250);

    // Ensure directory exists
    const generatedDir = path.join(process.cwd(), 'public', 'Certificate-Generator', 'Cer-Generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Save certificate
    const outPath = path.join(generatedDir, 'test-certificate.png');
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    
    stream.pipe(out);
    
    return new Promise<NextResponse>((resolve) => {
      out.on('finish', () => {
        console.log('Test certificate saved successfully');
        resolve(NextResponse.json({ 
          success: true, 
          path: '/Certificate-Generator/Cer-Generated/test-certificate.png',
          message: 'Simple test certificate generated successfully'
        }));
      });
      
      out.on('error', () => {
        console.error('Error writing test certificate');
        resolve(NextResponse.json(
          { success: false, message: 'Error saving test certificate' },
          { status: 500 }
        ));
      });
    });

  } catch (error: unknown) {
    console.error('Simple certificate test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: `Test failed: ${errorMessage}` },
      { status: 500 }
    );
  }
} 