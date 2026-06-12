import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Softech Infotech | Technology Partner Since 2002',
  description: 'Your trusted technology partner since 2002. Offering computer hardware sales & service, custom software solutions, web design, cloud computing, and more in Jamnagar, Gujarat.',
  keywords: 'Softech Infotech, computer hardware, PC builder, software solutions, Jamnagar, data recovery, cloud computing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
