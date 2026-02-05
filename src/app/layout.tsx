import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query';
import { Toaster } from '@/components/ui/sonner';
import { pretendard } from '@/lib/fonts';

export const metadata: Metadata = {
  title: {
    default: 'Ownership AI - 컨설턴트 관리 플랫폼',
    template: '%s | Ownership AI',
  },
  description: '1인 컨설턴트를 위한 고객 정보 관리 및 정부지원사업 매칭 SaaS 플랫폼',
  keywords: ['컨설턴트', '고객관리', 'CRM', '정부지원사업', '매칭', 'AI 매칭'],
  authors: [{ name: 'Ownership AI' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ownership-ai.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Ownership AI',
    title: 'Ownership AI - 컨설턴트 관리 플랫폼',
    description: '1인 컨설턴트를 위한 고객 정보 관리 및 정부지원사업 AI 매칭 플랫폼',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ownership AI - 컨설턴트 관리 플랫폼',
    description: '1인 컨설턴트를 위한 고객 정보 관리 및 정부지원사업 AI 매칭 플랫폼',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={`${pretendard.className} antialiased`}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
