import { NextResponse } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('logo') as File;
  const orgId = formData.get('organizationId') as string;

  if (!file || !orgId) {
    return NextResponse.json({ error: 'Logo file and organizationId are required' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Ensure directory exists
  const uploadDir = join(process.cwd(), 'public', 'Org-Logos');
  await mkdir(uploadDir, { recursive: true });

  // Save as /public/Org-Logos/{orgId}.png
  const filePath = join(uploadDir, `${orgId}.png`);
  await writeFile(filePath, buffer);

  const relativePath = `/Org-Logos/${orgId}.png`;
  return NextResponse.json({ path: relativePath });
} 