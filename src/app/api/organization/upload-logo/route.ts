import { NextRequest, NextResponse } from 'next/server';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer setup
const uploadDir = path.join(process.cwd(), 'public', 'Organizations_Logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use timestamp + original name for uniqueness
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });

// Helper to run multer in Next.js API route
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  // This is a workaround for Next.js API routes (Edge/Node)
  // Only works in Node.js runtime
  const express = require('express');
  const app = express();
  const res = {};
  await runMiddleware(req, res, upload.single('logo'));
  const file = req.file;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  // Return the relative path for storage in DB
  const relativePath = `/Organizations_Logos/${file.filename}`;
  return NextResponse.json({ path: relativePath });
} 