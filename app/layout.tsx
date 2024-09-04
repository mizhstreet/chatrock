import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ClerkProvider } from '@clerk/nextjs';
import { Sidebar } from '@/components/sidebar';

export const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={cn(
            'flex flex-row min-h-screen bg-background font-sans antialiased text-stone-700 bg-slate-100',
            fontSans.variable
          )}
        >
          <Sidebar />
          <div className="min-w-max w-full h-screen overflow-y-auto">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}