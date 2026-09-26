'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  FileCheck,
  Send,
  Loader2,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react';
import { DocumentUploader } from '@/components/upload/DocumentUploader';
import { DocumentList } from '@/components/documents/DocumentList';
import { SourcesGrid } from '@/components/sources/SourceCard';
import { Citation } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalChunks: 0,
    aiProvider: 'Built-in Demo Engine',
    supabaseConnected: false,
  });

  const [quickQuestion, setQuickQuestion] = useState('');
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [quickCitations, setQuickCitations] = useState<Citation[]>([]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalDocs: data.totalDocuments,
          totalChunks: data.totalChunks,
          aiProvider: data.aiProvider,
          supabaseConnected: data.supabaseConnected,
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    window.addEventListener('documind:refresh-documents', fetchStats);
    return () => window.removeEventListener('documind:refresh-documents', fetchStats);
  }, []);

  const handleAskQuick = async (qText?: string) => {
    const q = (qText || quickQuestion).trim();
    if (!q || loadingQuery) return;

    setQuickQuestion(q);
    setLoadingQuery(true);
    setQuickAnswer(null);
    setQuickCitations([]);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuickAnswer(data.answer);
        setQuickCitations(data.citations || []);
      } else {
        setQuickAnswer(`⚠️ ${data.error || 'Failed to generate answer'}`);
      }
    } catch (err) {
      setQuickAnswer(`⚠️ Network error occurred.`);
    } finally {
      setLoadingQuery(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await fetch('/api/demo/seed', { method: 'POST' });
      fetchStats();
      window.dispatchEvent(new Event('documind:refresh-documents'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden border border-slate-800/90 bg-gradient-to-b from-indigo-950/30 via-slate-900/60 to-slate-950/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Powered Multi-Document Intelligence Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            One AI. <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-400 bg-clip-text text-transparent">Every document.</span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
            Upload PDFs, spreadsheets, reports and images. Ask questions across your entire knowledge base and get answers grounded in your documents with verifiable source citations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#upload-zone"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Upload Documents</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={handleSeedDemo}
              className="px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700/80 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Try Demo Data</span>
            </button>

            <Link
              href="/chat"
              className="px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 font-semibold text-sm border border-cyan-800/40 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Open AI Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalDocs}</div>
            <div className="text-xs text-slate-400">Indexed Documents</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalChunks}</div>
            <div className="text-xs text-slate-400">Vector Embeddings</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">6 Formats</div>
            <div className="text-xs text-slate-400">PDF, DOCX, XLSX, CSV, TXT, OCR</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{stats.aiProvider.split('(')[0]}</div>
            <div className="text-xs text-slate-400">Multi-Source Reasoner</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Recent Documents */}
        <div className="lg:col-span-6 space-y-6">
          {/* Uploader Section */}
          <div id="upload-zone" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Upload Documents</span>
              </h2>
              <span className="text-xs text-slate-400">Drag or click to add</span>
            </div>

            <DocumentUploader onUploadSuccess={fetchStats} />
          </div>

          {/* Recent Documents Table */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                <span>Recent Documents</span>
              </h2>
              <Link
                href="/documents"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <DocumentList showSearch={false} />
          </div>
        </div>

        {/* Right Column: Instant Cross-Document Question Box */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Instant Multi-Document Query</span>
              </h2>
              <Link
                href="/chat"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Full Chat View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Ask a question combining sales, operating costs, and expansion factors:
            </p>

            {/* Quick Question Composer */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAskQuick();
              }}
              className="space-y-3"
            >
              <div className="relative">
                <textarea
                  value={quickQuestion}
                  onChange={e => setQuickQuestion(e.target.value)}
                  placeholder="e.g. Considering sales performance, operating costs and the expansion strategy, what should management consider before expanding into Europe?"
                  rows={3}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Retrieves across all uploaded formats
                </div>

                <button
                  type="submit"
                  disabled={!quickQuestion.trim() || loadingQuery}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingQuery ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Demo Question Shortcuts */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Click-to-test Demo Queries:
              </span>
              <div className="space-y-1.5">
                {[
                  'Considering sales performance, operating costs and the expansion strategy, what should management consider before expanding into Europe?',
                  'Compare sales performance in Europe and Asia.',
                  'What are the key governance prerequisites for expansion?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAskQuick(q)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform shrink-0" />
                    <span className="truncate">{q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Answer Container */}
            {quickAnswer && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Grounded AI Synthesis</span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {quickAnswer}
                </div>

                {quickCitations.length > 0 && (
                  <SourcesGrid citations={quickCitations} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
