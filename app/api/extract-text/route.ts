import { NextRequest } from 'next/server';
// pdf-parse and mammoth are CommonJS-only — use require to avoid ESM default-export error
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };
import * as XLSX from 'xlsx';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = file.name.toLowerCase();
    const ext = name.split('.').pop() ?? '';

    let text = '';

    if (ext === 'pdf') {
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const lines: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        lines.push(`\n=== Sheet: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        for (const row of rows) {
          lines.push(Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | '));
        }
      }
      text = lines.join('\n');
    } else if (ext === 'json') {
      const raw = buffer.toString('utf-8');
      try {
        const parsed = JSON.parse(raw);
        text = JSON.stringify(parsed, null, 2);
      } catch {
        text = raw;
      }
    } else {
      // Plain text fallback
      text = buffer.toString('utf-8');
    }

    return Response.json({ text: text.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}
