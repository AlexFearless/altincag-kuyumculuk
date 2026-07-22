export const metadata = {
  title: 'Kargo Politikası | Altınçag Kuyumculuk',
};

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            Kargo Politikası
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600">
            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo Ücreti
              </h2>
              <p>
                Tüm siparişlerde kargo ücretsizdir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo Süresi
              </h2>
              <p>
                Siparişleriniz, onayından itibaren 1-3 iş günü içinde kargoya verilir.
                Kargo teslim süresi, bulunduğunuz bölgeye göre 1-3 iş günüdür.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo Takibi
              </h2>
              <p>
                Siparişiniz kargoya verildiğinde, e-posta adresinize kargo takip numarası
                gönderilecektir. Bu numara ile kargonuzun durumunu takip edebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Hasarlı Kargo
              </h2>
              <p>
                Kargonuz hasarlı geldiyse, kargo görevlisinin önünde açınız ve tutanak
                tutturunuz. Hasarlı ürünleri 24 saat içinde müşteri hizmetlerimize
                bildiriniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Teslimat Adresi
              </h2>
              <p>
                Sadece İstanbul sınırları içindeki adreslere teslimat yapılmaktadır.
                Adres bilgilerinin eksik veya hatalı olması, teslimat gecikmelerine
                yol açabilir.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
