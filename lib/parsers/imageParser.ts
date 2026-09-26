import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface ExtractedImageChunk {
  content: string;
  section: string;
}

export async function parseImage(
  buffer: Buffer,
  mimeType: string = 'image/png'
): Promise<ExtractedImageChunk[]> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';

  const prompt = `You are a high-precision OCR and document analysis engine.
Extract ALL text, tables, forms, labels, and numbers from this image.
Preserve the visual structure:
- Convert tables into markdown tables with clear column headers.
- Extract any numbers, dates, currency symbols, and key-value pairs accurately.
- Retain section headings.
Output ONLY the extracted document text. Do not include any introductory phrases like "Here is the extracted text:".`;

  // 1. Try Gemini Vision if Gemini key is available
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const imagePart = {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const extractedText = result.response.text();

      if (extractedText && extractedText.trim().length > 0) {
        return [
          {
            content: extractedText.trim(),
            section: 'Visual OCR / Document Scan',
          },
        ];
      }
    } catch (err) {
      console.warn('Gemini vision OCR failed, attempting OpenAI or fallback:', err);
    }
  }

  // 2. Try OpenAI Vision if available
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const base64Image = buffer.toString('base64');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
      });

      const extractedText = response.choices[0]?.message?.content;
      if (extractedText && extractedText.trim().length > 0) {
        return [
          {
            content: extractedText.trim(),
            section: 'Visual OCR / Document Scan',
          },
        ];
      }
    } catch (err) {
      console.warn('OpenAI vision OCR failed:', err);
    }
  }

  // 3. Graceful fallback if no vision API key is configured
  return [
    {
      content: `[Scanned Image Document: Size ${(buffer.length / 1024).toFixed(1)} KB. Configure GEMINI_API_KEY or OPENAI_API_KEY for automatic multimodal OCR extraction.]`,
      section: 'Image Analysis Note',
    },
  ];
}
