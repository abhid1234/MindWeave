import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { OfflineIndicator, InstallPrompt, UpdatePrompt } from '@/components/pwa';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mindweave - AI-Powered Personal Knowledge Hub',
  description: 'Capture, organize, and rediscover your ideas, notes, bookmarks, and learnings',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mindweave',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            {/* Skip navigation link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
            >
              Skip to main content
            </a>
            {children}
            {/* PWA Components */}
            <OfflineIndicator />
            <InstallPrompt />
            <UpdatePrompt />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
