export const metadata = {
  title: 'KVKK Metni | Altınçag Kuyumculuk',
};

export default function KVKK() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            Kişisel Verilerin Korunması Kanunu (KVKK) Metni
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600 text-sm">
            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                1. Veri Sorumlusu
              </h2>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") kapsamında,
                kişisel verilerinizin veri sorumlusu Altınçag Kuyumculuk'tur.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                2. Kişisel Verilerin Toplanma Yöntemi
              </h2>
              <p>
                Kişisel verileriniz, web sitemiz, mobil uygulamalarımız ve mağazalarımız
                üzerinden toplanmaktadır. Bu veriler; ad-soyad, e-posta, telefon, adres,
                ödeme bilgileri gibi bilgileri içerebilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                3. Kişisel Verilerin İşlenme Amacı
              </h2>
              <p>
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Siparişlerinizin karşılanması ve teslimatı</li>
                <li>Müşteri hizmetleri taleplerinizin yanıtlanması</li>
                <li>Kampanya ve duyurulardan haberdar edilmeniz</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                4. Haklarınız
              </h2>
              <p>
                Kanunun 11. maddesi gereği, kişisel verilerinizle ilgili olarak:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Bilgi alma hakkınız</li>
                <li>Bilgilerinizi güncelleme hakkınız</li>
                <li>Bilgilerinizi silme hakkınız</li>
                <li>İşlemeye itiraz etme hakkınız</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                5. İletişim
              </h2>
              <p>
                KVKK kapsamındaki taleplerinizi info@altincagkuyumculuk.com
                adresine e-posta göndererek iletebilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
