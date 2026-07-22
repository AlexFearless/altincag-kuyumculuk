import Link from 'next/link';

export const metadata = {
  title: 'Ödeme Başarısız | Altınçag Kuyumculuk',
};

export default function PaymentFail() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-earth-800 mb-2">
          Ödeme Başarısız
        </h1>
        <p className="text-earth-500 mb-6">
          Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin veya
          farklı bir ödeme yöntemi seçin.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sepet"
            className="inline-block bg-gold-500 text-white px-6 py-3 rounded-sm font-medium
                       hover:bg-gold-600 transition-colors"
          >
            Sepete Dön
          </Link>
          <Link
            href="/"
            className="inline-block border-2 border-earth-200 text-earth-600 px-6 py-3 rounded-sm font-medium
                       hover:bg-earth-50 transition-colors"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
