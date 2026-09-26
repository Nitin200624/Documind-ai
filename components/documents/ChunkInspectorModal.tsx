'use client';

import React, { useEffect, useState } from 'react';
import { X, Layers, FileText, Hash, Table2, MapPin, Loader2 } from 'lucide-react';
import { DocumentRecord, DocumentChunkRecord } from '@/types';

interface ChunkInspectorModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export function ChunkInspectorModal({ document, onClose }: ChunkInspectorModalProps) {
  const [chunks, setChunks] = useState<DocumentChunkRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!document) return;

    const fetchChunks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/documents/${document.id}/chunks`);
        if (res.ok) {
          const data = await res.json();
          setChunks(data.chunks || []);
        }
      } catch (err) {
        console.error('Failed to fetch chunks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChunks();
  }, [document]);

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>{document.filename}</span>
                <span className="text-xs uppercase font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {document.file_type}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {chunks.length} extracted chunks indexed with normalized metadata & vector embeddings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              <p className="text-sm">Loading chunk data & vector coordinates...</p>
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No chunks recorded for this document.
            </div>
          ) : (
            chunks.map((chunk, idx) => {
              const meta = chunk.metadata || {};
              return (
                <div
                  key={chunk.id || idx}
                  className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 space-y-3"
                >
                  {/* Metadata bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" /> Chunk #{idx + 1}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {meta.page && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Page {meta.page}
                          {meta.totalPages ? ` of ${meta.totalPages}` : ''}
                        </span>
                      )}

                      {meta.sheet && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
                          <Table2 className="w-3 h-3" /> Sheet: {meta.sheet}
                          {meta.rows ? ` (Rows ${meta.rows})` : ''}
                        </span>
                      )}

                      {meta.section && (
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Section: {meta.section}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                        ~{meta.tokenEstimate || Math.round(chunk.content.length / 4)} tokens
                      </span>
                    </div>
                  </div>

                  {/* Chunk content */}
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                    {chunk.content}
                  </pre>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
