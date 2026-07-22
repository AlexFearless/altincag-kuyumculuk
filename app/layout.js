import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'AltınÇağ Kuyumculuk | Premium Altın Takı',
  description:
    'AltınÇağ Kuyumculuk - 22 ayar altın, yüzük, kolye, bileklik, kelepçe, küpe, zincir ve setler. Premium kalite, uygun fiyat.',
  keywords: 'kuyumcu, altın, yüzük, kolye, bileklik, kelepçe, küpe, zincir, set',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
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
