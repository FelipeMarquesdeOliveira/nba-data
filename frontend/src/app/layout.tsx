import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NBA Live Analyzer',
  description: 'Real-time NBA game analysis with player props',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F0F0F]">
        {children}
      </body>
    </html>
  );
}