import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { AuthGuard } from '@/components/auth-guard';
import { RTLFix } from '@/components/ui/rtl-fix';


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
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0891b2" />
      </head>
      <body className={cn('font-body antialiased')}>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster />
          <RTLFix />
        </AuthProvider>
      </body>
    </html>
  );
}
