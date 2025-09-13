import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

// Register fonts
const fontPath = path.join(process.cwd(), 'public', 'Certificate-Generator', 'fonts', 'OpenSans-Bold.ttf');
registerFont(fontPath, { family: 'OpenSans' });

export async function GET(request: NextRequest) {
  try {
    // Test data
    const testData = {
      studentName: 'Saad Abdullah',
      competitionName: 'National Solutions Convention',
      competitionEvent: 'NaSCon\'25',
      startDate: '18th April, 2025',
      endDate: '20th April, 2025',
      organizationName: 'FAST-NUCES',
      organizerName: 'Ms. Sarah Khan',
      organizerPosition: 'Convener',
      studentId: 'test-certificate',
      isTeamEvent: false,
    };

    // Create canvas
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');

    // Set up colors and fonts
    const purpleColor = '#4A148C';
    const blackColor = '#000000';
    const grayColor = '#333333';

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw borders
    ctx.strokeStyle = purpleColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    ctx.strokeStyle = blackColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Draw tree logo at top center
    const treeX = canvas.width / 2;
    const treeY = 120;
    
    // Tree trunk (person silhouette)
    ctx.fillStyle = blackColor;
    ctx.fillRect(treeX - 15, treeY - 40, 30, 60);
    
    // Tree canopy (colorful leaves)
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const angle = (i / 20) * 2 * Math.PI;
      const radius = 40 + Math.random() * 20;
      const x = treeX + Math.cos(angle) * radius;
      const y = treeY - 60 + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 12, 0, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Event name
    ctx.fillStyle = grayColor;
    ctx.font = 'bold 36px OpenSans';
    ctx.textAlign = 'center';
    ctx.fillText(testData.competitionEvent, treeX, treeY + 60);

    // Slogan
    ctx.font = 'italic 18px OpenSans';
    ctx.fillText("Where Talent Meets Opportunity!", treeX, treeY + 85);

    // Certificate title
    ctx.fillStyle = purpleColor;
    ctx.font = 'bold 48px OpenSans';
    ctx.fillText('CERTIFICATE', treeX, treeY + 140);
    ctx.fillText('OF ACHIEVEMENT', treeX, treeY + 190);

    // Presentation line
    ctx.fillStyle = blackColor;
    ctx.font = '20px OpenSans';
    ctx.fillText('This certificate is proudly presented to', treeX, treeY + 240);

    // Recipient name
    ctx.fillStyle = purpleColor;
    ctx.font = 'bold 32px OpenSans';
    ctx.fillText(testData.studentName, treeX, treeY + 280);

    // Underline
    ctx.strokeStyle = blackColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(treeX - 100, treeY + 290);
    ctx.lineTo(treeX + 100, treeY + 290);
    ctx.stroke();

    // Achievement description
    const achievementText = `for his/her active participation & valuable contribution at ${testData.competitionEvent} from ${testData.startDate} to ${testData.endDate} at ${testData.organizationName}`;
    
    ctx.fillStyle = blackColor;
    ctx.font = '16px OpenSans';
    ctx.textAlign = 'center';
    
    // Wrap text
    const maxWidth = canvas.width - 200;
    const words = achievementText.split(' ');
    let line = '';
    let y = treeY + 380;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, treeX, y);
        line = word + ' ';
        y += 25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, treeX, y);

    // Bottom section
    const bottomY = canvas.height - 150;
    
    // Left signature
    ctx.fillStyle = blackColor;
    ctx.font = '16px OpenSans';
    ctx.textAlign = 'left';
    ctx.fillText(testData.organizerName, 100, bottomY);
    ctx.font = '14px OpenSans';
    ctx.fillText(testData.organizerPosition, 100, bottomY + 20);
    ctx.fillText(testData.competitionEvent, 100, bottomY + 40);

    // Organization logo placeholder
    ctx.fillStyle = '#1E40AF';
    ctx.beginPath();
    ctx.arc(treeX, bottomY, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '12px OpenSans';
    ctx.textAlign = 'center';
    ctx.fillText('LOGO', treeX, bottomY + 4);

    // Right signature
    ctx.fillStyle = blackColor;
    ctx.font = '16px OpenSans';
    ctx.textAlign = 'right';
    ctx.fillText('Dr. Waseem Shahzad', canvas.width - 100, bottomY);
    ctx.font = '14px OpenSans';
    ctx.fillText('Campus Director at', canvas.width - 100, bottomY + 20);
    ctx.fillText(testData.organizationName, canvas.width - 100, bottomY + 40);

    // Ensure generated directory exists
    const generatedDir = path.join(process.cwd(), 'public', 'Certificate-Generator', 'Cer-Generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    // Save certificate
    const outPath = path.join(generatedDir, `${testData.studentId}.png`);
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    
    stream.pipe(out);
    
    return new Promise<NextResponse>((resolve) => {
      out.on('finish', () => {
        resolve(NextResponse.json({ 
          success: true, 
          path: `/Certificate-Generator/Cer-Generated/${testData.studentId}.png`,
          message: 'Test certificate generated successfully'
        }));
      });
      
      out.on('error', (error) => {
        console.error('Error writing test certificate:', error);
        resolve(NextResponse.json(
          { success: false, message: 'Error saving test certificate' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('Test certificate generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Error generating test certificate' },
      { status: 500 }
    );
  }
} 