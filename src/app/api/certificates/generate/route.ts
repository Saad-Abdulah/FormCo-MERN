import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

// Register fonts with error handling
try {
  const fontPath = path.join(process.cwd(), 'public', 'Certificate-Generator', 'fonts', 'OpenSans-Bold.ttf');
  registerFont(fontPath, { family: 'OpenSans' });
} catch (fontError) {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      competitionName,
      competitionEvent,
      competitionId,
      startDate,
      endDate,
      organizationName,
      organizerName,
      organizerPosition,
      orgLogoURL,
      studentId,
      isTeamEvent,
      teamName,
      teamMembers
    } = body;

    // Validate required fields
    if (!studentName || !competitionName || !studentId || !organizationName || !competitionId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: studentName, competitionName, studentId, organizationName, competitionId' },
        { status: 400 }
      );
    }
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required dates: startDate, endDate' },
        { status: 400 }
      );
    }

    // Load template and flower image
    const templatePath = path.join(process.cwd(), 'public', 'Certificate-Generator', 'templates', 'certificate_template.jpeg');
    const flowerPath = path.join(process.cwd(), 'public', 'Certificate-Generator', 'templates', 'flower-style.png');
    const [template, flower] = await Promise.all([
      loadImage(templatePath),
      loadImage(flowerPath)
    ]);
    // Use template dimensions (1012x714)
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(template, 0, 0, template.width, template.height);

    // --- Draw flower above competition name ---
    const centerX = canvas.width / 2;
    // Place flower at the top center, with some margin
    const flowerWidth = 140;
    const flowerHeight = 110;
    const flowerY = 55; // 55px from the top
    ctx.drawImage(flower, centerX - flowerWidth / 2, flowerY, flowerWidth, flowerHeight);

    // --- Shift all content upwards ---
    let y = 190; // Start higher up (was ~270 before)
    ctx.textAlign = 'center';

    // Event name (bold, black)
    ctx.font = 'bold 32px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText(competitionEvent || competitionName, centerX, y);
    y += 22;
    // Slogan
    ctx.font = 'italic 16px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#444';
    ctx.fillText('Where Talent Meets Opportunity!', centerX, y);
    y += 60;
    // Certificate title
    ctx.font = 'bold 44px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#4A148C';
    ctx.fillText('CERTIFICATE', centerX, y);
    y += 44;
    ctx.fillText('OF ACHIEVEMENT', centerX, y);
    y += 44;
    // Presentation line
    ctx.font = '20px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText('This certificate is proudly presented to', centerX, y);
    y += 36;
    // Recipient name (bold, purple)
    ctx.font = 'bold 40px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#4A148C';
    ctx.fillText(studentName, centerX, y);
    // Underline
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 120, y + 10);
    ctx.lineTo(centerX + 120, y + 10);
    ctx.stroke();
    y += 30;
    // Team info (if team event)
    if (isTeamEvent && teamName) {
      ctx.font = '18px OpenSans, Arial, sans-serif';
      ctx.fillStyle = '#222';
      ctx.fillText(`Team Members`, centerX, y);
      y += 22;
      if (teamMembers && teamMembers.length > 0) {
        ctx.font = '16px OpenSans, Arial, sans-serif';
        ctx.fillStyle = '#222';
        const memberNames = teamMembers.map((m: any) => m.name).join(', ');
        ctx.fillText(memberNames, centerX, y);
        y += 22;
      }
    }
    // --- Achievement description (3 fixed lines) ---
    let pronoun = 'his/her';
    if (isTeamEvent && teamMembers && teamMembers.length > 1) {
      pronoun = 'their';
    }
    ctx.font = '16px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#222';
    const line1 = `for ${pronoun} active participation & valuable contribution`;
    const line2 = `at ${competitionEvent || competitionName} from ${startDate} to ${endDate}`;
    const line3 = `at ${organizationName}`;
    let descY = y + 18;
    ctx.fillText(line1, centerX, descY);
    descY += 22;
    ctx.fillText(line2, centerX, descY);
    descY += 22;
    ctx.fillText(line3, centerX, descY);

    // --- Bottom signatures ---
    const bottomY = canvas.height - 90;
    ctx.textAlign = 'left';
    ctx.font = '16px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText(organizerName || 'Ms. Sarah Khan', 100, bottomY);
    ctx.font = '14px OpenSans, Arial, sans-serif';
    ctx.fillText(organizerPosition || 'Convener', 100, bottomY + 20);
    ctx.fillText(competitionEvent || competitionName, 100, bottomY + 40);
    // Organization logo at bottom center
    try {
      if (orgLogoURL) {
        const logo = await loadImage(orgLogoURL);
        const logoSize = 70;
        ctx.drawImage(logo, centerX - logoSize/2, bottomY - 30, logoSize, logoSize);
      }
    } catch (logoError) {}
    // Right signature
    ctx.textAlign = 'right';
    ctx.font = '16px OpenSans, Arial, sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText('Dr. Waseem Shahzad', canvas.width - 100, bottomY);
    ctx.font = '14px OpenSans, Arial, sans-serif';
    ctx.fillText('Campus Director at', canvas.width - 100, bottomY + 20);
    ctx.fillText(organizationName || 'FAST-NU', canvas.width - 100, bottomY + 40);

    // Save certificate as {studentId}_{competitionId}.png
    const generatedDir = path.join(process.cwd(), 'public', 'Certificate-Generator', 'Cer-Generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    const outPath = path.join(generatedDir, `${studentId}_${competitionId}.png`);
    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    return new Promise((resolve) => {
      out.on('finish', () => {
        resolve(NextResponse.json({
          success: true,
          path: `/Certificate-Generator/Cer-Generated/${studentId}_${competitionId}.png`
        }));
      });
      out.on('error', (error) => {
        resolve(NextResponse.json(
          { success: false, message: 'Error saving certificate' },
          { status: 500 }
        ));
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `Error generating certificate: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 