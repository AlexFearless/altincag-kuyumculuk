export const metadata = {
  title: 'Mesafeli Satış Sözleşmesi | AltınÇağ Kuyumculuk',
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
                1. Taraflar
              </h2>
              <p>
                Bu sözleşme, AltınÇağ Kuyumculuk (satıcı) ile web sitesinden alışveriş yapan müşteri arasında düzenlenmiştir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                2. Konu
              </h2>
              <p>
                İşbu sözleşmenin konusu, www.altincagkuyumculuk.com web sitesinden satın alınan ürünlerin satışı ve teslimi ile ilgili hak ve yükümlülüklerin düzenlenmesidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                3. Ürün Bilgileri
              </h2>
              <p>
                Ürünlerin temel özellikleri, fiyatları ve stok durumu web sitesinde belirtilmiştir. Ürün görselleri temsil amaçlıdır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                4. Fiyatlar
              </h2>
              <p>
                Ürün fiyatları KDV dahildir. Kargo ücreti fiyatlara dahil değildir. 6502 sayılı TKHK kapsamında fiyat bilgisi sipariş onayından önce müşteriye gösterilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                5. Sipariş ve Ödeme
              </h2>
              <p>
                Müşteri, sipariş verdiği anda bedeli tam olarak ödemiş olmalıdır. Havale ile ödemelerde banka onayı alındıktan sonra sipariş hazırlanmaya başlanır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                6. Kargo ve Teslimat
              </h2>
              <p>
                Sadece İstanbul içine kargo yapılmaktadır. MNG Kargo ile 1-3 iş günü içinde teslim edilir. Stokta olmayan ürünler için 7-30 gün üretim süresi olabilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                7. Cayma Hakkı (6502 sayılı TKHK md. 48)
              </h2>
              <p>
                Tüketici, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkına sahiptir. Cayma bildirimi yazılı olarak yapılmalıdır. Cayma halinde 10 iş günü içinde para iadesi yapılır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                8. Cayma Koşulları
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ürünün kullanılmamış, etiketli ve orijinal ambalajında olması gerekir</li>
                <li>Yüzük bedeninden kaynaklanan problemler cayma hakkı kapsamı dışındadır</li>
                <li>İade kargo ücreti müşteriye aittir</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                9. Sorumluluk
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ürünün kargo firmasına teslimine kadar olan sorumluluk satıcıya, sonrasında müşteriye aittir</li>
                <li>Adres hatalarından müşteri sorumludur</li>
                <li>Ödemeler lisanslı ödeme kuruluşları üzerinden gerçekleştirilir, kredi kartı bilgileri saklanmaz</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                10. Uyuşmazlıklar
              </h2>
              <p>
                İşbu sözleşmeye 6098 sayılı Türk Borçlar Kanunu ve 6502 sayılı Tüketici Haklarının Korunması Hakkında Kanun uygulanır. Uyuşmazlıklarda İstanbul mahkemeleri ve icra daireleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                11. İletişim
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
