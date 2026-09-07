import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://huddle-house-cafe-manager.khunphotograph.chatgpt.site'),
  title: 'Huddle House — Dashboard ร้าน',
  description: 'Dashboard อ่านอย่างเดียวสำหรับยอดขาย รายจ่าย กำไร สต็อก และรายการสั่งซื้อของ Huddle House',
  openGraph: {
    title: 'Huddle House — Dashboard ร้านกาแฟ',
    description: 'ยอดขาย รายจ่าย กำไร สต็อก และรายการที่ต้องซื้อในที่เดียว',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Huddle House — Dashboard ร้านกาแฟ',
    description: 'ยอดขาย รายจ่าย กำไร สต็อก และรายการที่ต้องซื้อในที่เดียว',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
