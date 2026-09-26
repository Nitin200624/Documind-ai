'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCheck,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { DocumentType } from '@/types';

interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'extracting' | 'embedding' | 'ready' | 'error';
  statusText: string;
  progress: number;
  errorMessage?: string;
}

interface DocumentUploaderProps {
  onUploadSuccess?: () => void;
}

export function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFormatBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">PDF</span>;
      case 'docx':
      case 'doc':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">DOCX</span>;
      case 'xlsx':
      case 'xls':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">XLSX</span>;
      case 'csv':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">CSV</span>;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">IMAGE</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">TXT</span>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    const newItems: UploadItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      statusText: 'Uploading...',
      progress: 25,
    }));

    setItems(prev => [...prev, ...newItems]);

    for (const item of newItems) {
      await processFileUpload(item);
    }
  };

  const processFileUpload = async (item: UploadItem) => {
    const updateItem = (updates: Partial<UploadItem>) => {
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, ...updates } : i)));
    };

    try {
      updateItem({ status: 'uploading', statusText: 'Uploading file...', progress: 30 });

      const formData = new FormData();
      formData.append('files', item.file);

      // Simulate status progression for responsive feedback
      const progressTimer = setTimeout(() => {
        updateItem({ status: 'extracting', statusText: 'Extracting content & tables...', progress: 60 });
      }, 600);

      const embeddingTimer = setTimeout(() => {
        updateItem({ status: 'embedding', statusText: 'Creating vector embeddings...', progress: 85 });
      }, 1400);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(progressTimer);
      clearTimeout(embeddingTimer);

      const data = await res.json();

      if (res.ok && data.success) {
        updateItem({
          status: 'ready',
          statusText: 'Ready',
          progress: 100,
        });
        if (onUploadSuccess) onUploadSuccess();
        window.dispatchEvent(new Event('documind:refresh-documents'));
      } else {
        updateItem({
          status: 'error',
          statusText: 'Processing Failed',
          progress: 100,
          errorMessage: data.error || 'Failed to parse file content',
        });
      }
    } catch (err) {
      updateItem({
        status: 'error',
        statusText: 'Upload Error',
        progress: 100,
        errorMessage: err instanceof Error ? err.message : 'Network error',
      });
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-slate-100 mb-1">
          Drag & drop your documents here, or <span className="text-cyan-400 underline underline-offset-4">browse files</span>
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Drop heterogeneous files together. Our engine extracts text, tables, and vision data into a unified RAG vector index.
        </p>

        {/* Supported badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['PDF', 'DOCX', 'XLSX', 'CSV', 'TXT', 'JPG / PNG'].map(fmt => (
            <span
              key={fmt}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Uploaded Files Queue */}
      {items.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Uploading & Processing Pipeline</span>
            <button
              onClick={() => setItems([])}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear list
            </button>
          </div>

          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getFormatBadge(item.name)}
                    <span className="text-sm font-medium text-slate-200 truncate">{item.name}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(item.size)}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'ready' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                        <FileCheck className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}

                    {['uploading', 'extracting', 'embedding'].includes(item.status) && (
                      <span className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {item.statusText}
                      </span>
                    )}

                    {item.status === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-800/50">
                        <AlertCircle className="w-3.5 h-3.5" /> Error
                      </span>
                    )}

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-500 hover:text-slate-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      item.status === 'ready'
                        ? 'bg-emerald-500'
                        : item.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {item.errorMessage && (
                  <p className="text-xs text-rose-400">{item.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
