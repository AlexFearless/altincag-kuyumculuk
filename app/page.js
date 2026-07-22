'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';


const categories = [
  { name: 'Bileklik', href: '/kategori/bileklik', image: '/kategoriler/bileklik' },
  { name: 'Kelepçe', href: '/kategori/kelepce', image: '/kategoriler/kelepce' },
  { name: 'Kolye', href: '/kategori/kolye', image: '/kategoriler/kolye' },
  { name: 'Küpe', href: '/kategori/kupe', image: '/kategoriler/kupe' },
  { name: 'Yüzük', href: '/kategori/yuzuk', image: '/kategoriler/yuzuk' },
  { name: 'Zincir', href: '/kategori/zincir', image: '/kategoriler/zincir' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= 9 && hour < 20;
  const isSunday = now.getDay() === 0;

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/products?featured=true&limit=8');
      const data = await res.json();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <img
          src="/hero-banner.jpg"
          alt="Altınçag Kuyumculuk"
          className="w-full h-auto block"
        />
      </section>

      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-earth-800 mb-10">
            Kategoriler
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="group block"
              >
                <div className="aspect-[4/5] bg-earth-100 rounded-lg overflow-hidden mb-3">
                  <img
                    src={`${category.image}.jpg`}
                    alt={category.name}
                    loading="lazy"
                    width="400"
                    height="500"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = `${category.image}.jpeg`; }}
                  />
                </div>
                <span className="text-sm font-medium text-earth-700 group-hover:text-gold-600 transition-colors flex items-center gap-1">
                  {category.name} <span className="text-earth-400 group-hover:text-gold-500">&rarr;</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-earth-800">
              Öne Çıkan Ürünler
            </h2>
            <Link
              href="/kategori/yuzuk"
              className="text-gold-600 hover:text-gold-700 text-sm font-medium"
            >
              Tümünü Gör &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-square bg-earth-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-earth-100 rounded w-1/3" />
                    <div className="h-4 bg-earth-100 rounded w-2/3" />
                    <div className="h-5 bg-earth-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4 opacity-30" />
              <h3 className="font-serif text-xl text-earth-600 mb-2">Ürünler yakında!</h3>
              <p className="text-earth-400">
                Koleksiyonumuz çok yakında sizlerle olacak.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <InstagramIcon className="w-8 h-8 text-earth-400 mx-auto mb-4" />
          <p className="text-xs text-earth-400 uppercase tracking-[0.2em] mb-2">
            Instagram · 6,2 B Takipçi
          </p>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-earth-800 mb-3">
            Vitrinimiz cebinizde
          </h2>
          <p className="text-earth-500 text-sm mb-4 max-w-md mx-auto">
            Yeni gelen modeller, mağazadan kareler ve günlük kombinler için bizi takip edin.
          </p>
          <a
            href="https://www.instagram.com/altincag.kuyumculuk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-earth-800 font-semibold text-sm border-b-2 border-gold-500 pb-0.5 hover:text-gold-600 transition-colors"
          >
            @altincag.kuyumculuk
          </a>

          <div className="grid grid-cols-3 gap-1.5 mt-8 max-w-2xl mx-auto">
            {[
              { bg: 'bg-earth-200', label: 'Yüzük', file: 'yuzuk.jpeg' },
              { bg: 'bg-earth-300', label: 'Kolye', file: 'kolye.jpeg' },
              { bg: 'bg-earth-200', label: 'Bileklik', file: 'bileklik.jpeg' },
              { bg: 'bg-earth-300', label: 'Küpe', file: 'kupe.jpeg' },
              { bg: 'bg-earth-200', label: 'Set', file: 'set.jpeg' },
              { bg: 'bg-earth-300', label: 'Zincir', file: 'zincir.jpeg' },
            ].map((item, i) => (
              <a
                key={i}
                href="https://www.instagram.com/altincag.kuyumculuk/"
                target="_blank"
                rel="noopener noreferrer"
                className={`aspect-square ${item.bg} rounded-sm flex items-center justify-center group overflow-hidden`}
              >
                <img
                  src={`/urunler/${item.file}`}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </a>
            ))}
          </div>

          <a
            href="https://www.instagram.com/altincag.kuyumculuk/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 bg-gold-500 text-white px-8 py-3 rounded-sm text-sm font-medium hover:bg-gold-600 transition-colors"
          >
            Takip Et
          </a>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-earth-800 mb-10">
            Ne İçin Arıyorsunuz?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-2">Yıldönümü</h3>
              <p className="text-sm text-earth-500 mb-4">Beraber geçen her yıla değer katan parçalar.</p>
              <Link href="/kategori/kolye" className="text-sm font-semibold text-earth-800 hover:text-gold-600 transition-colors">
                Kolyeleri Gör &rarr;
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-2">Doğum Günü</h3>
              <p className="text-sm text-earth-500 mb-4">Onu şaşırtacak, yıllarca kalacak bir hediye.</p>
              <Link href="/kategori/kupe" className="text-sm font-semibold text-earth-800 hover:text-gold-600 transition-colors">
                Küpeleri Gör &rarr;
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-2">Evlilik Teklifi</h3>
              <p className="text-sm text-earth-500 mb-4">Hayatın en özel anı için özenle seçilmiş yüzükler.</p>
              <Link href="/kategori/yuzuk" className="text-sm font-semibold text-earth-800 hover:text-gold-600 transition-colors">
                Yüzükleri Gör &rarr;
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-2">Kendine Hediye</h3>
              <p className="text-sm text-earth-500 mb-4">Bazen en güzel hediye kendine aldığınızdır.</p>
              <Link href="/kategori/bileklik" className="text-sm font-semibold text-earth-800 hover:text-gold-600 transition-colors">
                Bileklikleri Gör &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-white border-t border-earth-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <p className="text-xs text-earth-400 uppercase tracking-[0.2em] mb-3 font-medium">Mağaza</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-earth-800 mb-4">
                Mağazamızı Ziyaret Edin
              </h2>
              <p className="text-earth-500 text-sm leading-relaxed mb-8 max-w-md">
                Altınçag Kuyumculuk'a hoş geldiniz. Mağazamızda geniş ürün yelpazemizi keşfedin ve uzman ekibimizle tanışın.
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="text-xs text-earth-400 uppercase tracking-wider w-20 pt-0.5 flex-shrink-0 font-medium">Adres</span>
                  <span className="text-sm text-earth-700">
                    Çağlayan, Vatan Cd. No:55/C,<br />
                    34403 Kağıthane / İstanbul
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-earth-400 uppercase tracking-wider w-20 flex-shrink-0 font-medium">Telefon</span>
                  <a href="tel:+902122322212" className="text-sm text-earth-700 hover:text-gold-600 transition-colors">
                    (0212) 232 22 12
                  </a>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-xs text-earth-400 uppercase tracking-wider w-20 pt-0.5 flex-shrink-0 font-medium">Çalışma Saatleri</span>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between gap-8">
                      <span className="text-earth-600">Pazartesi — Cumartesi</span>
                      <span className="text-earth-800 font-medium">09:00 — 20:00</span>
                    </div>
                    <div>
                      <span className="text-earth-600">Pazar </span>
                      <span className="text-red-400 font-medium">Kapalı</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {isSunday || !isOpen ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-xs text-red-400">Şu an kapalı</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-green-600">Şu an açık</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <a
                  href="https://www.google.com/maps/place/%C3%87a%C4%9Flayan,+Vatan+Cd.+No:55,+34403+Ka%C4%9Fitane%2F%C4%B0stanbul,+%D0%A2%D1%83%D1%80%D1%86%D0%B8%D1%8F/@41.0862,28.9766,16z/data=!4m6!3m5!1s0x14cab6e612907189:0x58cdd4fc5ab2473c!8m2!3d41.0762574!4d28.9814077!16s%2Fg%2F11nnky_vb0?hl=tr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-earth-800 text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-earth-700 transition-colors"
                >
                  Yol Tarifi Al
                </a>
                <a
                  href="tel:+902122322212"
                  className="border border-earth-300 text-earth-700 px-6 py-3 rounded-sm text-sm font-medium hover:border-gold-500 hover:text-gold-600 transition-colors"
                >
                  ARA
                </a>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-earth-100 h-[350px] lg:h-[420px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.9!2d28.9766!3d41.0862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab6e612907189:0x58cdd4fc5ab2473c!2sAlt%C4%B1n%C3%A7a%C4%9F+Kuyumculuk!5e0!3m2!1str!2str!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AltınÇağ Kuyumculuk Konumu"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-earth-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <TruckIcon className="w-12 h-12 text-gold-500 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2">Ücretsiz Kargo</h3>
              <p className="text-earth-300 text-sm">
                Tüm siparişlerde ücretsiz kargo
              </p>
            </div>
            <div className="p-6">
              <ShieldIcon className="w-12 h-12 text-gold-500 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2">Güvenli Alışveriş</h3>
              <p className="text-earth-300 text-sm">
                PayTR ile güvenli ödeme
              </p>
            </div>
            <div className="p-6">
              <ReturnIcon className="w-12 h-12 text-gold-500 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2">Koşulsuz İade</h3>
              <p className="text-earth-300 text-sm">
                14 gün içinde koşulsuz iade garantisi
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TruckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75m-7.5-2.25h7.5m-7.5 0H9m7.5 0v-3.375c0-.621-.504-1.125-1.125-1.125H9.75v3.375c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function ReturnIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
