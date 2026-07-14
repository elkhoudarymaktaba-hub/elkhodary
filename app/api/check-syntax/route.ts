import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  try {
    const content = fs.readFileSync('d:\\AI AGENT\\ELKHODARY\\app\\boxes\\[id]\\box-detail-client.tsx', 'utf8');
    
    let lineNum = 1;
    let charNum = 0;
    const stack: any[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      charNum++;
      if (char === '\n') {
        lineNum++;
        charNum = 0;
      }
      
      // Skip strings
      if (char === '"' || char === "'") {
        const quote = char;
        i++;
        while (i < content.length && content[i] !== quote) {
          if (content[i] === '\n') lineNum++;
          i++;
        }
        continue;
      }

      // Skip single line comments
      if (char === '/' && content[i + 1] === '/') {
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
        lineNum++;
        charNum = 0;
        continue;
      }

      // Skip multi-line comments
      if (char === '/' && content[i + 1] === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
          if (content[i] === '\n') lineNum++;
          i++;
        }
        i++;
        continue;
      }
      
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: lineNum, col: charNum });
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          errors.push(`Extra close character '${char}' at line ${lineNum}, col ${charNum}`);
          continue;
        }
        
        const last = stack.pop();
        const match = (last.char === '{' && char === '}') ||
                      (last.char === '(' && char === ')') ||
                      (last.char === '[' && char === ']');
        if (!match) {
          errors.push(`Mismatch: opened '${last.char}' at line ${last.line}, col ${last.col} but closed '${char}' at line ${lineNum}, col ${charNum}`);
          stack.push(last);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      length: content.length,
      stack,
      errors
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
