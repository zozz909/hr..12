import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ClientNavbar } from '@/components/client-navbar';


export const metadata: Metadata = {
  title: 'مساعد الموارد البشرية',
  description: 'نظام إدارة موارد بشرية متعدد المؤسسات.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <div className="flex min-h-screen">
          <ClientNavbar />
          <main className="flex-1">
              {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
