'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Table2,
  Image as ImageIcon
} from 'lucide-react';
import { Citation, DocumentType } from '@/types';

interface SourceCardProps {
  citation: Citation;
  index: number;
}

export function SourceCard({ citation, index }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="group rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700/80 p-3.5 transition-all cursor-pointer shadow-sm"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 shrink-0 mt-0.5">
            {getDocIcon(citation.fileType)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                {citation.filename}
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {citation.fileType}
              </span>
            </div>

            {/* Location Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {citation.page !== undefined && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  <FileText className="w-2.5 h-2.5" /> Page {citation.page}
                </span>
              )}

              {citation.sheet && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                  <Table2 className="w-2.5 h-2.5" /> Sheet: {citation.sheet}
                  {citation.rows ? ` (${citation.rows})` : ''}
                </span>
              )}

              {citation.section && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                  <MapPin className="w-2.5 h-2.5" /> {citation.section}
                </span>
              )}

              {citation.relevanceScore !== undefined && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/30">
                  {citation.relevanceScore}% match
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="text-slate-500 group-hover:text-slate-300 p-1 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Snippet Excerpt */}
      {expanded ? (
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
          {citation.preview}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {citation.preview}
        </p>
      )}
    </div>
  );
}

export function SourcesGrid({ citations }: { citations?: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>Retrieved Grounded Sources ({citations.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {citations.map((citation, idx) => (
          <SourceCard key={citation.chunkId || idx} citation={citation} index={idx} />
        ))}
      </div>
    </div>
  );
}
