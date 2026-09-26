import * as XLSX from 'xlsx';

export interface ExtractedSheetChunk {
  content: string;
  sheet: string;
  rows: string;
}

export async function parseSpreadsheet(
  buffer: Buffer,
  isCsv = false
): Promise<ExtractedSheetChunk[]> {
  try {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      raw: false, // get formatted text strings
    });

    const chunks: ExtractedSheetChunk[] = [];
    const sheetNames = workbook.SheetNames;

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      // Convert sheet to JSON array of arrays
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });

      if (!data || data.length === 0) continue;

      // Identify headers (row 0)
      const rawHeaders = data[0] || [];
      const headers = rawHeaders.map((h, i) => (h !== undefined && h !== null && String(h).trim() !== '' ? String(h).trim() : `Column_${i + 1}`));
      const dataRows = data.slice(1);

      if (dataRows.length === 0) {
        chunks.push({
          content: `Sheet: ${sheetName} | Headers: ${headers.join(', ')} (No data rows)`,
          sheet: sheetName,
          rows: '1',
        });
        continue;
      }

      // Group rows in batches of 10 to keep semantic units together
      const batchSize = 10;
      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        const startRow = i + 2; // 1-indexed, accounting for header row
        const endRow = Math.min(i + batchSize + 1, dataRows.length + 1);

        const rowStrings: string[] = [];
        for (let rIdx = 0; rIdx < batch.length; rIdx++) {
          const row = batch[rIdx];
          const currentRowNum = startRow + rIdx;

          // Format: Region: USA | Sales: ₹80 lakh | Year: 2025
          const cellPairs: string[] = [];
          for (let cIdx = 0; cIdx < headers.length; cIdx++) {
            const header = headers[cIdx];
            const value = row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]).trim() : '';
            if (value !== '') {
              cellPairs.push(`${header}: ${value}`);
            }
          }

          if (cellPairs.length > 0) {
            rowStrings.push(`[Row ${currentRowNum}] ${cellPairs.join(' | ')}`);
          }
        }

        if (rowStrings.length > 0) {
          const chunkContent = `Dataset: ${sheetName}\nSchema: ${headers.join(' | ')}\n\n` + rowStrings.join('\n');
          chunks.push({
            content: chunkContent,
            sheet: sheetName,
            rows: `${startRow}-${endRow}`,
          });
        }
      }
    }

    if (chunks.length === 0) {
      return [
        {
          content: 'Spreadsheet contained empty sheets.',
          sheet: isCsv ? 'CSV' : 'Sheet1',
          rows: '1',
        },
      ];
    }

    return chunks;
  } catch (error) {
    console.error('Error in parseSpreadsheet:', error);
    throw new Error(`Failed to parse spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
