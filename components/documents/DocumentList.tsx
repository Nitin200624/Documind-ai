'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Layers,
  Trash2,
  Search,
  Eye,
  Calendar,
  HardDrive,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { DocumentRecord, DocumentType } from '@/types';
import { ChunkInspectorModal } from './ChunkInspectorModal';

interface DocumentListProps {
  initialDocuments?: DocumentRecord[];
  onDocumentChange?: () => void;
  showSearch?: boolean;
}

export function DocumentList({
  initialDocuments,
  onDocumentChange,
  showSearch = true,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments || []);
  const [loading, setLoading] = useState(!initialDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [inspectingDoc, setInspectingDoc] = useState<DocumentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    const handleRefresh = () => fetchDocuments();
    window.addEventListener('documind:refresh-documents', handleRefresh);
    return () => window.removeEventListener('documind:refresh-documents', handleRefresh);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document and all its indexed chunks?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (onDocumentChange) onDocumentChange();
        window.dispatchEvent(new Event('documind:refresh-documents'));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getFormatIcon = (type: DocumentType) => {
    switch (type) {
      case 'pdf':
        return <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>;
      case 'docx':
        return <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>;
      case 'xlsx':
      case 'csv':
        return <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0"><FileSpreadsheet className="w-4 h-4" /></div>;
      case 'image':
        return <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || doc.file_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by filename or content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'pdf', 'docx', 'xlsx', 'csv', 'image', 'txt'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-all whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/80'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List / Table */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm">Loading document inventory...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">No documents found</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchQuery
                ? 'No documents matched your search filter.'
                : 'Upload your PDFs, spreadsheets, Word documents, or image scans to start querying.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => setInspectingDoc(doc)}
              className="group p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-sm hover:shadow-md"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                {getFormatIcon(doc.file_type)}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                      {doc.filename}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {doc.file_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      {formatFileSize(doc.file_size)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      {doc.chunk_count} {doc.chunk_count === 1 ? 'chunk' : 'chunks'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Status & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {doc.status === 'ready' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                )}
                {doc.status === 'processing' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/50">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processing
                  </span>
                )}
                {doc.status === 'error' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-800/50">
                    <AlertTriangle className="w-3 h-3" /> Error
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setInspectingDoc(doc);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                    title="Inspect Chunks & Metadata"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => handleDelete(doc.id, e)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-40"
                    title="Delete document"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Chunks Modal */}
      <ChunkInspectorModal
        document={inspectingDoc}
        onClose={() => setInspectingDoc(null)}
      />
    </div>
  );
}
