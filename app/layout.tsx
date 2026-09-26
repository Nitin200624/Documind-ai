import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DocuMind AI | Multi-Document Intelligence & RAG Platform',
  description: 'Ask questions across heterogeneous documents: PDFs, Excel spreadsheets, DOCX, CSV, TXT, and scanned images. Powered by grounded multi-source RAG and precise citations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased`}>
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>DocuMind AI — Heterogeneous Multi-Document RAG Platform</div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>PDF • DOCX • XLSX • CSV • TXT • OCR</span>
              <span>•</span>
              <span>Grounded Citations</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
