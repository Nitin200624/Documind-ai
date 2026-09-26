'use client';

import React, { useState } from 'react';
import {
  FolderOpen,
  UploadCloud,
  Layers,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DocumentUploader } from '@/components/upload/DocumentUploader';
import { DocumentList } from '@/components/documents/DocumentList';

export default function DocumentsPage() {
  const [showUploadZone, setShowUploadZone] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-cyan-400" />
            <span>Document Library & Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your heterogeneous documents, inspect extracted chunks, and monitor vector status.
          </p>
        </div>

        <button
          onClick={() => setShowUploadZone(!showUploadZone)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          {showUploadZone ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Hide Uploader</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Upload New Documents</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Uploader Zone */}
      {showUploadZone && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300">
          <DocumentUploader
            onUploadSuccess={() => {
              // keep open or notify
            }}
          />
        </div>
      )}

      {/* Document Inventory List with Filters & Search */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-md">
        <DocumentList showSearch={true} />
      </div>
    </div>
  );
}
