# DocuMind AI — Multi-Document Intelligence & Cross-Source RAG Platform

> **"One AI. Every document. Ask questions across your entire knowledge base."**

DocuMind AI is an enterprise-grade Document Intelligence and Multi-Document Retrieval-Augmented Generation (RAG) SaaS platform. It ingests heterogeneous document formats (**PDF**, **DOCX**, **XLSX**, **CSV**, **TXT**, and **scanned images via Vision OCR**), parses them into a normalized structured representation with granular metadata, indexes them using vector embeddings (`pgvector`), and answers natural-language queries by synthesizing and citing facts across multiple disparate sources simultaneously.

---

## 🌟 Key Features

1. **Heterogeneous Document Ingestion**:
   - **PDF**: Page-by-page text extraction retaining exact page numbers.
   - **DOCX**: Hierarchical section, heading, and table extraction with mammoth.
   - **XLSX & CSV**: Structured sheet and row context preservation (e.g. `Region: USA | Sales: ₹80 lakh | Year: 2025`).
   - **TXT**: Semantic paragraph and block chunking.
   - **Images (JPG, PNG)**: Multimodal OCR vision processing extracting tables, text, and layouts.

2. **Normalized Metadata Model**:
   - Every chunk retains origin metadata (`document_id`, `filename`, `file_type`, `page`, `sheet`, `rows`, `section`, `tokenEstimate`).

3. **Multi-Source Diversity Retrieval**:
   - Prevents single-document bias by re-ranking vector candidates across distinct document sources.

4. **Strict Grounding & Hallucination Prevention**:
   - Answers strictly according to retrieved document context.
   - If information is absent or unsupported, answers: *"I couldn't find enough information in the uploaded documents to answer that confidently."*

5. **Verifiable Source Citations**:
   - Clickable source cards with document type badges, page/sheet/row/section locations, similarity scores, and snippet previews.

6. **1-Click Hackathon Demo Mode**:
   - Instant "⚡ Try Demo Data" button preloads 4 realistic cross-format documents (PDF, Excel, Word, Image) for immediate cross-document queries without manual file uploads.

7. **Zero-Config Resilient Architecture**:
   - Operates with Supabase PostgreSQL (`pgvector`) when configured.
   - Seamlessly falls back to an in-memory vector store with cosine similarity calculation when running locally without DB credentials.

---

## 🏗️ System Architecture

```
[User Uploads: PDF / DOCX / XLSX / CSV / TXT / PNG]
                   │
                   ▼
       [Format Detection & Modular Parsers]
  ├─ PDF Parser ─────► Page extraction (Page 14)
  ├─ DOCX Parser ────► Heading & Table extraction (Section: European Expansion)
  ├─ Sheet Parser ───► Row context & Headers (Sheet: Sales, Rows: 2-5)
  └─ Image OCR ──────► Multimodal Vision OCR (Logistics Hub Note)
                   │
                   ▼
         [Sensible Chunker]
  (300-600 words with token estimation & boundary preservation)
                   │
                   ▼
     [Vector Embeddings (768-dim)]
   (Local deterministic vectors by default / optional OpenAI embeddings)
                   │
                   ▼
   [Vector Database (Supabase pgvector / Memory Store)]
                   │
═══════════════════╪═════════════════════════════════════════════
                   │
            [USER ASKS QUERY]
                   │
                   ▼
         [Query Vectorization]
                   │
                   ▼
    [Vector Similarity Match (Cosine)]
                   │
                   ▼
   [Multi-Source Diversity Re-ranking]
  (Balances candidates across PDF + Excel + DOCX + Image)
                   │
                   ▼
   [Context Construction + History Context]
                   │
                   ▼
      [Grounded LLM Generation Engine]
   (Groq / optional OpenAI / Grounded Synthesizer)
                   │
                   ▼
  [AI Answer with In-Text & Structured Citations]
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ or 20+ (tested on Node v26)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

Populate your preferred keys:
```env
# Cloud LLM answer generation (Preferred: Groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
# Local embeddings and OCR are used by default.
# Optional legacy Gemini ingestion paths:
USE_GEMINI_EMBEDDINGS=false
USE_GEMINI_OCR=false

# Optional: OpenAI fallback
OPENAI_API_KEY=your_openai_api_key_here

# Supabase pgvector (Optional - leave blank to use in-memory vector store)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
> **Note**: Even if you leave all API keys blank, the app will run with the built-in intelligent demo engine so you can present without downtime!

### 4. Run the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄️ Supabase PostgreSQL + pgvector Setup

If you want to persist documents and vectors in Supabase:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Copy your project URL, anon key, and service role key into `.env.local`.
5. Restart your Next.js server. The navigation bar will automatically reflect your live Supabase connection!

---

## 🎯 Demo Questions for Judges

When demonstrating DocuMind AI to hackathon judges:

### 1. The Cross-Document Reasoning Question (3+ Sources)
> **Question**:  
> *"Considering sales performance, operating costs and the company's expansion strategy, what should management consider before expanding into Europe?"*

**What happens**:
- Retrieves **Europe sales: ₹65 lakh** from `Q4_Regional_Sales.xlsx` (Sheet: Regional Sales)
- Retrieves **Operating costs increased by 20%** and **Operating margin compressed to 14.2%** from `Annual_Report_2025.pdf` (Page 14)
- Retrieves **Direct office expansion in Frankfurt/Paris** and **Prerequisites: GDPR & EU AI Act compliance** from `Global_Expansion_Strategy.docx` (Section: European Expansion Strategy)
- Synthesizes an executive grounded recommendation with clickable source citation badges!

### 2. Tabular Comparison
> **Question**:  
> *"Compare sales performance across USA, Europe, and Asia."*

### 3. Multi-Turn Conversation (Follow-Up)
> **User**: *"What region performed best?"*  
> **DocuMind AI**: *"USA with ₹80 lakh..."*  
> **User**: *"Why?"*  
> **DocuMind AI**: Explains YoY growth and enterprise demand referencing context from the previous turn.

### 4. Hallucination Check (Negative Test)
> **Question**:  
> *"What is the capital expenditure budget for 2026?"*  
> **DocuMind AI**:  
> *"I couldn't find enough information in the uploaded documents to answer that confidently."*

---

## 🚢 Deploying to Vercel

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "DocuMind AI Hackathon MVP"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` (or `OPENAI_API_KEY`)
   - `NEXT_PUBLIC_SUPABASE_URL` (if using Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will build and host the application with edge/serverless API routes.
