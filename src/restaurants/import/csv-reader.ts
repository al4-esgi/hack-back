import { createReadStream } from 'fs';
import readline from 'readline';

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"' && nextChar === '"' && inQuotes) {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
};

export const readCsvAsObjects = async (filePath: string): Promise<Record<string, string>[]> => {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const rows: string[][] = [];
  let pending = '';
  let quoteCount = 0;

  for await (const line of rl) {
    pending = pending ? `${pending}\n${line}` : line;
    quoteCount += (line.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) continue;
    rows.push(parseCsvLine(pending));
    pending = '';
    quoteCount = 0;
  }
  if (pending) rows.push(parseCsvLine(pending));
  if (!rows.length) return [];

  const [headers, ...dataRows] = rows;
  return dataRows.map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] ?? '').trim();
    });
    return obj;
  });
};

