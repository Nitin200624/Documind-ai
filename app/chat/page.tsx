'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Loader2 } from 'lucide-react';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || undefined;

  return <ChatInterface initialQuestion={initialQuery} />;
}

export default function ChatPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="text-sm">Initializing DocuMind AI...</span>
          </div>
        }
      >
        <ChatContent />
      </Suspense>
    </div>
  );
}
