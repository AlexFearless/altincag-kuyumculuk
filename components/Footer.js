'use client';

import { useState } from 'react';
import Link from 'next/link';

const footerLinks = {
  categories: [
    { name: 'Yüzük', href: '/kategori/yuzuk' },
    { name: 'Kolye', href: '/kategori/kolye' },
    { name: 'Bileklik', href: '/kategori/bileklik' },
    { name: 'Küpe', href: '/kategori/kupe' },
    { name: 'Zincir', href: '/kategori/zincir' },
    { name: 'Setler', href: '/kategori/set' },
  ],
  politikalar: [
    { name: 'Mesafeli Satış Sözleşmesi', href: '/sozlesmeler/mesafeli-satis' },
    { name: 'İade Koşulları', href: '/sozlesmeler/iade' },
    { name: 'KVKK Metni', href: '/sozlesmeler/kvkk' },
    { name: 'Kargo Politikası', href: '/sozlesmeler/kargo' },
  ],
  kurumsal: [
    { name: 'Hakkımızda', href: '/hakkimizda' },
    { name: 'Kargo Takip', href: '/kargo-takip' },
    { name: 'İletişim', href: '/iletisim' },
    { name: 'Destek Talepleri', href: '/destek' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-white border-t border-earth-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Logo & Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-earth-800">AltınÇağ</h3>
                  <p className="text-[10px] text-earth-400 tracking-[0.2em] uppercase">Kuyumculuk</p>
                </div>
              </div>
              <p className="text-sm text-earth-500 leading-relaxed mb-4">
                2025 yılından bu yana güvenilir kuyumculuk hizmeti sunuyoruz.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/altincag.kuyumculuk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-earth-50 rounded-full text-earth-400 hover:text-gold-500 hover:bg-gold-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/902122322212"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-earth-50 rounded-full text-earth-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Kurumsal */}
            <div>
              <h4 className="font-serif text-sm font-semibold text-earth-800 mb-4">Kurumsal</h4>
              <ul className="space-y-2.5">
                {footerLinks.kurumsal.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-earth-500 hover:text-gold-600 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kategoriler */}
            <div>
              <h4 className="font-serif text-sm font-semibold text-earth-800 mb-4">Kategoriler</h4>
              <ul className="space-y-2.5">
                {footerLinks.categories.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-earth-500 hover:text-gold-600 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* E-Bülten */}
            <div>
              <h4 className="font-serif text-sm font-semibold text-earth-800 mb-4">E-Bülten</h4>
              <p className="text-sm text-earth-500 mb-4">
                Yeni ürünler ve kampanyalardan haberdar olun.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  className="w-full px-4 py-2.5 bg-earth-50 border border-earth-200 rounded-sm
                             text-sm text-earth-700 placeholder-earth-400
                             focus:outline-none focus:border-gold-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-gold-500 text-white px-4 py-2.5 rounded-sm text-sm font-medium
                             hover:bg-gold-600 transition-colors"
                >
                  {subscribed ? 'Abone olundu!' : 'Abone Ol'}
                </button>
              </form>
            </div>
          </div>
        </div>

      {/* Politikalar + Copyright */}
      <div className="border-t border-earth-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {footerLinks.politikalar.map((link) => (
                <Link key={link.href} href={link.href} className="text-xs text-earth-400 hover:text-gold-500 transition-colors">
                  {link.name}
                </Link>
              ))}
            </div>
            <p className="text-xs text-earth-400">
              &copy; {new Date().getFullYear()} AltınÇağ Kuyumculuk. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
