import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeRegistry from '@/theme/ThemeRegistry';
import SeedInitializer from '@/components/layout/SeedInitializer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DealFlow – Deals & Offers',
  description: 'Manage deals and offers for polymer distribution',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          <SeedInitializer />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
