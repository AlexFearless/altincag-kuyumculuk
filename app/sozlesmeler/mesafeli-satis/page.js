export const metadata = {
  title: 'Mesafeli Satış Sözleşmesi | Ömer Has Kuyumculuk',
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
                Taraflar
              </h2>
              <p>
                Bu sözleşme, Ömer Has Kuyumculuk (satıcı) ile web sitesinden alışveriş yapan müşteri arasında düzenlenmiştir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Konu
              </h2>
              <p>
                İşbu sözleşmenin konusu, müşterinin www.omerhaskuyumculuk.com web sitesinden satın aldığı ürünlerin satışı ve teslimi ile ilgili hak ve yükümlülüklerin düzenlenmesidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Ürün Bilgileri
              </h2>
              <p>
                Ürünlerin temel özellikleri, fiyatları ve stok durumu web sitesinde belirtilmiştir. Ürün görselleri temsil amaçlıdır, renk farklılıkları olabilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Fiyatlar
              </h2>
              <p>
                Ürün fiyatları KDV dahildir. Kargo ücreti fiyatlara dahil değildir. Fiyatlar önceden haber verilmeden değiştirilebilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Sipariş ve Ödeme
              </h2>
              <p>
                Müşteri, sipariş verdiği anda bedeli tam olarak ödemiş olmalıdır. Havale ile ödemelerde, banka onayı alındıktan sonra sipariş hazırlanmaya başlanır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo ve Teslimat
              </h2>
              <p>
                Sadece İstanbul içine kargo yapılmaktadır. Kargo firması tarafından 1-3 iş günü içinde teslim edilir. Stokta olmayan ürünler için 7-30 gün üretim süresi olabilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Cayma Hakkı (14 Gün)
              </h2>
              <p>
                Mesafeli sözleşmelerde müşteri, ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkına sahiptir. Cayma bildirimi yazılı olarak yapılmalıdır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Cayma Koşulları
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ürünün kullanılmamış, etiketli ve orijinal ambalajında olması gerekir</li>
                <li>Yüzük bedeninden kaynaklanan problemler cayma hakkı kapsamı dışındadır</li>
                <li>İade kargo ücreti müşteriye aittir</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Sorumluluk
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ürünün kargo firmasına teslimine kadar olan sorumluluk satıcıya, sonrasında müşteriye aittir</li>
                <li>Adres hatalarından müşteri sorumludur</li>
                <li>Ödemeler lisanslı ödeme kuruluşları üzerinden gerçekleştirilir, kredi kartı bilgileri tarafımızca saklanmaz</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Uyuşmazlıklar
              </h2>
              <p>
                İşbu sözleşmeye Türk Hukuku uygulanır. Uyuşmazlıklarda İstanbul mahkemeleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İletişim
              </h2>
              <p>
                omerhaskuyumculuk@gmail.com<br />
                +90 545 614 09 80<br />
                Sultan Selim Mah. Sultan Selim Cad. No: 14/A, 34415 Kağıthane / İstanbul
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
