import Link from 'next/link';

export const metadata = {
  title: 'Ödeme Başarılı | Altınçag Kuyumculuk',
};

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-earth-800 mb-2">
          Ödeme Başarılı!
        </h1>
        <p className="text-earth-500 mb-6">
          Siparişiniz başarıyla oluşturuldu. Sipariş detayları e-posta adresinize gönderilecektir.
        </p>
        <Link
          href="/"
          className="inline-block bg-gold-500 text-white px-6 py-3 rounded-sm font-medium
                     hover:bg-gold-600 transition-colors"
        >
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
}
