import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AeroShift Move',
  description: 'Exposure-aware route comparison system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
