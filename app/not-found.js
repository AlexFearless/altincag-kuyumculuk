import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="font-serif text-6xl font-bold text-earth-300 mb-4">404</h1>
        <h2 className="font-serif text-2xl text-earth-600 mb-2">Sayfa Bulunamadı</h2>
        <p className="text-earth-400 mb-6">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-block bg-gold-500 text-white px-6 py-3 rounded-sm font-medium
                     hover:bg-gold-600 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
