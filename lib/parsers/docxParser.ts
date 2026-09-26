import mammoth from 'mammoth';

export interface ExtractedDocxSection {
  content: string;
  section: string;
}

export async function parseDocx(buffer: Buffer): Promise<ExtractedDocxSection[]> {
  try {
    // 1. Convert to HTML to preserve headings and structure
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const html = htmlResult.value;

    if (!html || html.trim().length === 0) {
      // Try raw text extraction fallback
      const rawResult = await mammoth.extractRawText({ buffer });
      const raw = rawResult.value.trim();
      return [{ content: raw || 'Empty document', section: 'Main Content' }];
    }

    // Split HTML by headings to identify logical sections
    // e.g. <h1>Section Title</h1> or <h2>...
    const sections: ExtractedDocxSection[] = [];
    let currentSection = 'General Overview';
    let currentTextParts: string[] = [];

    // Simple robust tag-based parser
    const blocks = html.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>|<table[^>]*>.*?<\/table>|<p[^>]*>.*?<\/p>)/gi).filter(Boolean);

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const headingMatch = trimmed.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
      if (headingMatch) {
        if (currentTextParts.length > 0) {
          const sectionContent = currentTextParts.join('\n\n').trim();
          if (sectionContent.length > 0) {
            sections.push({
              section: currentSection,
              content: sectionContent,
            });
          }
          currentTextParts = [];
        }
        currentSection = headingMatch[1].replace(/<[^>]+>/g, '').trim() || 'Section';
        continue;
      }

      // Check table
      if (trimmed.startsWith('<table')) {
        const tableText = parseHtmlTable(trimmed);
        if (tableText) {
          currentTextParts.push(tableText);
        }
        continue;
      }

      // Paragraph
      const cleanParagraph = trimmed.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (cleanParagraph.length > 0) {
        currentTextParts.push(cleanParagraph);
      }
    }

    if (currentTextParts.length > 0) {
      const sectionContent = currentTextParts.join('\n\n').trim();
      if (sectionContent.length > 0) {
        sections.push({
          section: currentSection,
          content: sectionContent,
        });
      }
    }

    if (sections.length === 0) {
      const rawResult = await mammoth.extractRawText({ buffer });
      return [{ content: rawResult.value.trim(), section: 'Document Body' }];
    }

    return sections;
  } catch (error) {
    console.error('Error in parseDocx:', error);
    throw new Error(`Failed to parse DOCX document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseHtmlTable(tableHtml: string): string {
  const rowMatches = tableHtml.match(/<tr[^>]*>.*?<\/tr>/gi);
  if (!rowMatches) return '';

  const rows: string[][] = [];
  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<(td|th)[^>]*>(.*?)<\/(td|th)>/gi);
    if (!cellMatches) continue;
    const cells = cellMatches.map(cell => cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
    rows.push(cells);
  }

  if (rows.length === 0) return '';
  const headers = rows[0];
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) {
    return headers.join(' | ');
  }

  return dataRows
    .map((row, index) => {
      const formattedCells = row.map((cell, cIdx) => {
        const header = headers[cIdx] || `Col${cIdx + 1}`;
        return `${header}: ${cell}`;
      });
      return `Row ${index + 1}: ${formattedCells.join(' | ')}`;
    })
    .join('\n');
}
