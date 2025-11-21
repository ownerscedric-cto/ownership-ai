import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query';

export const metadata: Metadata = {
  title: 'Ownership AI - 컨설턴트 관리 플랫폼',
  description: '1인 컨설턴트를 위한 고객 정보 관리 및 정부지원사업 매칭 SaaS 플랫폼',
  keywords: ['컨설턴트', '고객관리', 'CRM', '정부지원사업', '매칭'],
  authors: [{ name: 'Ownership AI' }],
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
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
