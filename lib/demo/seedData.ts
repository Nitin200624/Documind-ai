import { DocumentRepository } from '@/lib/db/repository';
import { generateEmbedding } from '@/lib/embeddings/embedder';
import { DocumentRecord, DocumentChunkRecord } from '@/types';

export async function seedDemoData(): Promise<{ success: boolean; message: string; documents: DocumentRecord[] }> {
  const now = new Date().toISOString();

  // Document 1: Annual Report PDF
  const doc1Id = crypto.randomUUID();
  const doc1: DocumentRecord = {
    id: doc1Id,
    filename: 'Annual_Report_2025.pdf',
    file_type: 'pdf',
    file_size: 2450000,
    storage_path: 'demo/Annual_Report_2025.pdf',
    status: 'ready',
    chunk_count: 3,
    metadata: {
      totalPages: 48,
      fiscalYear: '2025',
      author: 'Finance & Strategy Committee',
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  };

  const doc1Chunks = [
    {
      document_id: doc1Id,
      content: `Global Consolidated Financial Overview (FY2025):
The enterprise achieved aggregate annual revenue of ₹310 Cr, representing a 14% year-over-year improvement. Gross margins expanded to 62.4% driven by cloud software growth. Total operating expenditures stood at ₹185 Cr, with ongoing investments in automation and regional expansion infrastructure.`,
      metadata: {
        filename: 'Annual_Report_2025.pdf',
        fileType: 'pdf' as const,
        page: 2,
        totalPages: 48,
        chunkIndex: 0,
      },
    },
    {
      document_id: doc1Id,
      content: `Regional Operating Cost Analysis & Inflationary Pressures:
Operating expenditures across Western Europe increased by 20% year-over-year. The primary drivers included newly implemented cross-border logistics tariffs, carbon tax compliance, and tech talent wage increases in Central European offices. Consequently, European operating margins contracted from 18.5% down to 14.2%, emphasizing the urgent need for cost discipline prior to further facility commitments.`,
      metadata: {
        filename: 'Annual_Report_2025.pdf',
        fileType: 'pdf' as const,
        page: 14,
        totalPages: 48,
        chunkIndex: 1,
      },
    },
    {
      document_id: doc1Id,
      content: `Capital Allocation Strategy and International Risk Factors:
Management has designated 25% of annual capital expenditure towards overseas territory expansion. Identified risk factors include Eurozone regulatory compliance deadlines (EU AI Act & ESG disclosures), currency volatility between EUR and INR, and localized supply chain disruptions affecting physical hardware rollouts.`,
      metadata: {
        filename: 'Annual_Report_2025.pdf',
        fileType: 'pdf' as const,
        page: 22,
        totalPages: 48,
        chunkIndex: 2,
      },
    },
  ];

  // Document 2: Regional Sales Excel
  const doc2Id = crypto.randomUUID();
  const doc2: DocumentRecord = {
    id: doc2Id,
    filename: 'Q4_Regional_Sales.xlsx',
    file_type: 'xlsx',
    file_size: 118000,
    storage_path: 'demo/Q4_Regional_Sales.xlsx',
    status: 'ready',
    chunk_count: 2,
    metadata: {
      sheets: ['Regional Sales', 'Product Breakdown'],
      quarter: 'Q4 2025',
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  };

  const doc2Chunks = [
    {
      document_id: doc2Id,
      content: `Dataset: Regional Sales
Schema: Region | Sales | Units Sold | Growth YoY | Margin %

[Row 2] Region: USA | Sales: ₹80 lakh | Units Sold: 4,200 | Growth YoY: +15% | Margin %: 28%
[Row 3] Region: Europe | Sales: ₹65 lakh | Units Sold: 3,100 | Growth YoY: +4% | Margin %: 14%
[Row 4] Region: Asia | Sales: ₹58 lakh | Units Sold: 3,900 | Growth YoY: +22% | Margin %: 24%
[Row 5] Region: Latin America | Sales: ₹24 lakh | Units Sold: 1,400 | Growth YoY: +8% | Margin %: 19%`,
      metadata: {
        filename: 'Q4_Regional_Sales.xlsx',
        fileType: 'xlsx' as const,
        sheet: 'Regional Sales',
        rows: '2-5',
        chunkIndex: 0,
      },
    },
    {
      document_id: doc2Id,
      content: `Dataset: Product Breakdown
Schema: Product Line | Global Revenue | Primary Market | Churn Rate

[Row 2] Product Line: Enterprise AI Suite | Global Revenue: ₹145 lakh | Primary Market: USA | Churn Rate: 1.2%
[Row 3] Product Line: Document Intelligence API | Global Revenue: ₹82 lakh | Primary Market: Europe | Churn Rate: 2.1%
[Row 4] Product Line: Edge IoT Analytics | Global Revenue: ₹50 lakh | Primary Market: Asia | Churn Rate: 3.5%`,
      metadata: {
        filename: 'Q4_Regional_Sales.xlsx',
        fileType: 'xlsx' as const,
        sheet: 'Product Breakdown',
        rows: '2-4',
        chunkIndex: 1,
      },
    },
  ];

  // Document 3: Global Expansion Strategy DOCX
  const doc3Id = crypto.randomUUID();
  const doc3: DocumentRecord = {
    id: doc3Id,
    filename: 'Global_Expansion_Strategy.docx',
    file_type: 'docx',
    file_size: 480000,
    storage_path: 'demo/Global_Expansion_Strategy.docx',
    status: 'ready',
    chunk_count: 2,
    metadata: {
      sections: ['European Expansion Strategy', 'Risk Mitigation & Requirements'],
      author: 'Corporate Development Team',
    },
    created_at: now,
  };

  const doc3Chunks = [
    {
      document_id: doc3Id,
      content: `Section: European Expansion Strategy:
The strategic roadmap targets direct operational expansion into Western European hubs, concentrating on Frankfurt, Paris, and Amsterdam. The plan stipulates establishing localized sales teams within an 18-month timeline and allocating ₹1.2 Cr in upfront market development capital. The initiative aims to capture rising enterprise demand for grounded multi-modal document intelligence solutions across financial and legal sectors.`,
      metadata: {
        filename: 'Global_Expansion_Strategy.docx',
        fileType: 'docx' as const,
        section: 'European Expansion Strategy',
        chunkIndex: 0,
      },
    },
    {
      document_id: doc3Id,
      content: `Section: Expansion Prerequisites & Governance Constraints:
Board approval for Phase 2 deployment is strictly contingent upon:
1. Reining in regional operating costs to return European margins to at least 18%.
2. Formalizing third-party logistics agreements to neutralize warehouse transit bottlenecks.
3. Full compliance sign-off for EU General Data Protection Regulation (GDPR) and the EU Artificial Intelligence Act.
No long-term lease agreements may be signed until Q3 financial audits validate regional cost stabilization.`,
      metadata: {
        filename: 'Global_Expansion_Strategy.docx',
        fileType: 'docx' as const,
        section: 'Expansion Prerequisites & Governance Constraints',
        chunkIndex: 1,
      },
    },
  ];

  // Document 4: Visual Inspection Scan (Image)
  const doc4Id = crypto.randomUUID();
  const doc4: DocumentRecord = {
    id: doc4Id,
    filename: 'Berlin_Hub_Audit_Note.png',
    file_type: 'image',
    file_size: 920000,
    storage_path: 'demo/Berlin_Hub_Audit_Note.png',
    status: 'ready',
    chunk_count: 1,
    metadata: {
      ocrEngine: 'Gemini Multimodal Vision',
      inspectionDate: 'November 2025',
    },
    created_at: now,
  };

  const doc4Chunks = [
    {
      document_id: doc4Id,
      content: `Visual Document OCR Scan - Facility Logistics Review:
Site: Berlin Pilot Logistics Hub
Auditor: Operations Risk Assurance Group
Key Findings:
- Document turnaround latency: 3.4 business days (target: 24 hours).
- Local customs clearing overhead: +12% surcharge on cross-border shipments.
- Recommendation: Prior to expanding commercial volume in Europe, transition inventory handling to automated bonded fulfillment centers.`,
      metadata: {
        filename: 'Berlin_Hub_Audit_Note.png',
        fileType: 'image' as const,
        section: 'Visual OCR / Logistics Review',
        chunkIndex: 0,
      },
    },
  ];

  // Save documents to Repository
  await DocumentRepository.createDocument(doc1);
  await DocumentRepository.createDocument(doc2);
  await DocumentRepository.createDocument(doc3);
  await DocumentRepository.createDocument(doc4);

  // Generate embeddings for all chunks and insert
  const allChunks = [...doc1Chunks, ...doc2Chunks, ...doc3Chunks, ...doc4Chunks];
  const chunkEmbeddings = await Promise.all(
    allChunks.map(async c => {
      const vec = await generateEmbedding(c.content);
      return {
        document_id: c.document_id,
        content: c.content,
        metadata: c.metadata,
        embedding: vec,
      };
    })
  );

  await DocumentRepository.insertChunks(chunkEmbeddings);

  return {
    success: true,
    message: 'Seeded 4 multi-format demo documents (PDF, Excel, Word, Image) with vector embeddings.',
    documents: [doc1, doc2, doc3, doc4],
  };
}
