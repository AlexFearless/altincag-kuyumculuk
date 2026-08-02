import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ToastProvider } from '@/components/Toast';
import NonceApplier from '@/components/NonceApplier';
import { headers } from 'next/headers';

export const metadata = {
  title: 'AltınÇağ Kuyumculuk | Premium Altın Takı',
  description:
    'AltınÇağ Kuyumculuk - 22 ayar altın, yüzük, kolye, bileklik, kelepçe, küpe, zincir ve setler. Premium kalite, uygun fiyat.',
  keywords: 'kuyumcu, altın, yüzük, kolye, bileklik, kelepçe, küpe, zincir, set',
};

export default function RootLayout({ children }) {
  const h = headers();
  const nonce = h.get('x-content-security-policy-nonce') || '';

  return (
    <html lang="tr" data-nonce={nonce}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <NonceApplier nonce={nonce} />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <AnnouncementBanner />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <FloatingButtons />
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
