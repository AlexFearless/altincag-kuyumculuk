export const metadata = {
  title: 'İade ve Değişim Politikası | AltınÇağ Kuyumculuk',
};

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            İade ve Değişim Politikası
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600">
            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Cayma Hakkı (6502 sayılı TKHK md. 48)
              </h2>
              <p>
                Mesafeli sözleşmelerde tüketici, ürünün kendisine teslim tarihinden itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir. Cayma bildiriminin yazılı olarak (e-posta, WhatsApp) yapılması yeterlidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Cayma Koşulları
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ürünün kullanılmamış, etiketli ve orijinal ambalajında olması gerekir</li>
                <li><strong>Yüzük bedeninden kaynaklanan problemler cayma hakkı kapsamı dışındadır</strong> (kişiselleştirilmiş ürün istisnası)</li>
                <li>Cayma hakkının kullanılması halinde, satın alma bedeli 10 iş günü içinde iade edilir</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Para İadesi
              </h2>
              <p>
                Cayma bildiriminizin ulaşmasını takip eden 10 iş günü içinde, ürünün SATIN ALMA bedeli orijinal ödeme yönteminize iade edilir. Kargo ücreti müşteriye aittir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Değişim
              </h2>
              <p>
                Değişim yapılmak istenirse, ilk ürün iade edilip yeni ürün için ayrı bir sipariş verilmesi gerekir. En hızlı yol budur.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Hasarlı veya Kusurlu Ürünler
              </h2>
              <p>
                Ürünü teslim aldığınızda kontrol ediniz. Kusurlu veya hasarlı ürünleri 48 saat içinde kuyumculukaltincag@gmail.com adresine bildiriniz. TKHK kapsamında ayıplı mal sorumluluğu saklıdır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Cayma Hakkı Dışında Kalan Durumlar
              </h2>
              <p>
                Aşağıdaki ürünler kişisel bakım, hijyen veya kişiselleştirme niteliğinde olduğundan cayma hakkı kapsamı dışındadır:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Müşteri ölçüsüne göre üretilmiş yüzükler (beden hatası hariç)</li>
                <li>Kullanılmış veya etiketi çıkarılmış ürünler</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Süre
              </h2>
              <p>
                Cayma hakkı 14 gündür. Bu süre, ürünün tüketiciye veya belirttiği adresteki üçüncü kişiye teslim tarihinden itibaren başlar.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İletişim
              </h2>
              <p>
                AltınÇağ Kuyumculuk<br />
                Çağlayan, Vatan Cd. No:55/C, 34403 Kağıthane/İstanbul<br />
                (0212) 232 22 12<br />
                kuyumculukaltincag@gmail.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
