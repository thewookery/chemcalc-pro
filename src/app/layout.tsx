import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/AppHeader';
import { LiveBridgeProvider } from '@/context/LiveBridgeContext';
import { LiveBridgeStatusBar } from '@/components/bridge/LiveBridgeStatusBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Z & S QC lab tools',
  description: 'Specialized calculators for chemical production and lab work.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LiveBridgeProvider>
            <AppHeader />
            <LiveBridgeStatusBar />
            <main className="flex-grow container mx-auto px-4 py-8 animate-slideUp">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Toaster />
          </LiveBridgeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
