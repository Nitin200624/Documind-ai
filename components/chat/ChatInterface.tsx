'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Trash2,
  Filter,
  Check,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  FileText
} from 'lucide-react';
import { ChatMessage, Citation, DocumentRecord } from '@/types';
import { SourcesGrid } from '@/components/sources/SourceCard';

interface ChatInterfaceProps {
  initialQuestion?: string;
}

export function ChatInterface({ initialQuestion }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuestion || '');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'Considering sales performance, operating costs and the expansion strategy, what should management consider before expanding into Europe?',
    'Compare sales performance in Europe and Asia.',
    'What region performed best?',
    'What are the key governance and regulatory prerequisites for expansion?',
    'What is the capital expenditure budget for 2026?',
  ];

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents for filter:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    window.addEventListener('documind:refresh-documents', fetchDocuments);
    return () => window.removeEventListener('documind:refresh-documents', fetchDocuments);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          conversationHistory: messages,
          filterDocIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer || 'No response generated.',
          citations: data.citations || [],
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ Error: ${data.error || 'Failed to answer question.'}`,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ Network error: ${err instanceof Error ? err.message : 'Could not reach server'}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleDocFilter = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto w-full bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Bar / Filter Control */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Ask DocuMind AI</h2>
            <p className="text-[11px] text-slate-400">
              Retrieves, joins, and grounds answers across multi-format documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Document filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {selectedDocIds.length === 0
                  ? 'All Documents'
                  : `${selectedDocIds.length} Selected`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>Scope Filter</span>
                  {selectedDocIds.length > 0 && (
                    <button
                      onClick={() => setSelectedDocIds([])}
                      className="text-cyan-400 hover:underline capitalize"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1">
                  {documents.length === 0 ? (
                    <div className="text-xs text-slate-500 p-2">No documents available</div>
                  ) : (
                    documents.map(doc => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleDocFilter(doc.id)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-xs text-slate-300 transition-colors"
                        >
                          <span className="truncate pr-2">{doc.filename}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear conversation */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Cross-Document Intelligence Ready
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Ask complex questions requiring synthesis across PDFs, spreadsheets, Word documents, and image scans.
            </p>

            {/* Suggested Sample Questions */}
            <div className="w-full space-y-2 text-left">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
                Suggested Cross-Document Queries:
              </div>
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(q)}
                  className="w-full p-3 text-xs text-slate-300 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-800/60 text-left transition-all flex items-start gap-2.5 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="flex-1">{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-indigo-600/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-md'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-xs shadow-sm'
                }`}
              >
                {/* Formatted Markdown Message Body */}
                <div className="prose prose-invert prose-sm max-w-none space-y-2 whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Grounded Source Citations */}
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <SourcesGrid citations={msg.citations} />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-indigo-600/20">
              <Bot className="w-4 h-4" />
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-xs p-4 text-sm text-slate-300 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-200">Retrieving across knowledge base...</span>
                <span className="text-[11px] text-slate-400">Embedding query & synthesizing grounded citations</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/95">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center bg-slate-950/80 border border-slate-800 focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30 rounded-xl transition-all shadow-inner"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question across your documents (e.g., 'Compare European sales and operating cost factors')..."
            rows={2}
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none"
          />

          <div className="pr-3">
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Grounded retrieval with source verification</span>
        </div>
      </div>
    </div>
  );
}
