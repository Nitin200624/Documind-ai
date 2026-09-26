export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'txt' | 'image';

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface ChunkMetadata {
  filename: string;
  fileType: DocumentType;
  page?: number;
  totalPages?: number;
  sheet?: string;
  rows?: string;
  section?: string;
  chunkIndex: number;
  tokenEstimate?: number;
  [key: string]: any;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  file_type: DocumentType;
  file_size: number;
  storage_path?: string | null;
  status: DocumentStatus;
  error_message?: string | null;
  chunk_count: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DocumentChunkRecord {
  id: string;
  document_id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
  similarity?: number;
  created_at: string;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  filename: string;
  fileType: DocumentType;
  preview: string;
  page?: number;
  sheet?: string;
  rows?: string;
  section?: string;
  relevanceScore?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface ConversationRecord {
  id: string;
  title: string;
  created_at: string;
  messages?: ChatMessage[];
}

export interface ParsedDocumentResult {
  filename: string;
  fileType: DocumentType;
  fileSize: number;
  chunks: {
    content: string;
    metadata: Omit<ChunkMetadata, 'chunkIndex'>;
  }[];
  rawTextPreview?: string;
}
