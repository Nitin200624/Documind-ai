'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Sparkles,
  Layers,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SystemStatus {
  supabaseConnected: boolean;
  aiProvider: string;
  hasLlmKey: boolean;
  totalDocuments: number;
  totalChunks: number;
}

export function Navbar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedDemo = async () => {
    setLoadingSeed(true);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToastMessage('✅ Demo data loaded! 4 heterogeneous documents ready for cross-source queries.');
        fetchStatus();
        window.dispatchEvent(new Event('documind:refresh-documents'));
      } else {
        setToastMessage(`❌ Error: ${data.error || 'Failed to seed demo data'}`);
      }
    } catch {
      setToastMessage('❌ Network error while loading demo data');
    } finally {
      setLoadingSeed(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all uploaded documents and in-memory chunks?')) return;
    setLoadingClear(true);
    try {
      const res = await fetch('/api/demo/clear', { method: 'POST' });
      if (res.ok) {
        setToastMessage('🧹 Knowledge base cleared.');
        fetchStatus();
        window.dispatchEvent(new Event('documind:refresh-documents'));
      }
    } catch {
      setToastMessage('❌ Failed to clear knowledge base');
    } finally {
      setLoadingClear(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const navLinks = [
    { label: 'Dashboard', href: '/' },
    { label: 'Documents', href: '/documents' },
    { label: 'Ask AI', href: '/chat' },
  ];

  return (
    <header className="border-b border-slate-800/90 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">DocuMind</span>
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent font-extrabold text-lg">AI</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/40">
                  Multi-Doc RAG
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Ask questions across all your documents.</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
            {navLinks.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/70'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions & Status */}
        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs py-1.5 px-3 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Docs:</span>
            <span className="font-semibold text-white">{status?.totalDocuments ?? 0}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Chunks:</span>
            <span className="font-semibold text-cyan-300">{status?.totalChunks ?? 0}</span>
          </div>

          {/* 1-Click Demo Seed Button */}
          <button
            onClick={handleSeedDemo}
            disabled={loadingSeed}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
            title="Preload 4 cross-format documents (PDF, Excel, DOCX, Image) for immediate demo questions"
          >
            {loadingSeed ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            )}
            <span>{loadingSeed ? 'Seeding...' : '⚡ Try Demo Data'}</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            disabled={loadingClear}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-colors"
            title="Reset / Clear Knowledge Base"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 max-w-md text-sm text-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <p className="flex-1">{toastMessage}</p>
        </div>
      )}
    </header>
  );
}
