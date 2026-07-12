import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { key, data } = await request.json();
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'lib', 'mock_db.json');
    let db: Record<string, any> = {};

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        db = JSON.parse(fileContent);
      } catch (e) {
        db = {};
      }
    }

    db[key] = data;
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
