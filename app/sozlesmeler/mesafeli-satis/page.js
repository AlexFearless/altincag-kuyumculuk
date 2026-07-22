export const metadata = {
  title: 'Mesafeli Satış Sözleşmesi | Altınçag Kuyumculuk',
};

export default function DistanceSalesContract() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            Mesafeli Satış Sözleşmesi
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600">
            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                MADDE 1 - KONU
              </h2>
              <p>
                İşbu sözleşmenin konusu, Satıcının, Alıcıya sunduğu mal ve hizmetlerin
                satışını ve bu satışa ilişkin şartların belirlenmesini kapsar.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                MADDE 2 - TARAFLAR
              </h2>
              <p>
                <strong>Satıcı:</strong> Altınçag Kuyumculuk<br />
                Adres: Çağlayan, Vatan Cd. No:55/C, 34403 Kağıthane/İstanbul<br />
                Telefon: (0212) 232 22 12<br />
                E-posta: info@altincagkuyumculuk.com
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                MADDE 3 - ÜRÜNLER
              </h2>
              <p>
                Sipariş edilen ürünlerin türü, miktarı, marka/modeli, rengi ve satış fiyatı
                Alıcının sipariş özeti sayfasında belirtildiği gibidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                MADDE 4 - ÖDEME
              </h2>
              <p>
                Alıcı, sipariş ettiği ürünlerin bedelini ödeme seçeneklerinden birini
                kullanarak ödeyebilir. Kredi kartı ile yapılan ödemelerde, kart bilgileri
                PayTR güvenlik altyapısı ile güvenli bir şekilde işlenir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                MADDE 5 - KARGO
              </h2>
              <p>
                Tüm siparişlerde kargo ücreti Satıcı tarafından karşılanır.
                Kargo teslim süresi, sipariş onayından itibaren 1-3 iş günüdür.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                MADDE 6 - İPTAL VE İADE
              </h2>
              <p>
                Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde sebep göstermeksizin
                sözleşmeden cayma hakkına sahiptir. İade edilecek ürünün kullanılmamış,
                hasar görmemiş ve orijinal ambalajında olması gerekmektedir.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
