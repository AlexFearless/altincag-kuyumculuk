export const metadata = {
  title: 'Gizlilik Politikası | Ömer Has Kuyumculuk',
};

export default function GizlilikPolitikasi() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            Gizlilik Politikası
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600 text-sm">
            <section>
              <p>
                Ömer Has Kuyumculuk, siz müşterilere kişisel bir alışveriş deneyimi sunmak amacıyla bu web sitesini işletmektedir. İşbu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde, kullandığınızda veya bizimle iletişime geçtiğinizde kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve paylaştığımızı açıklamaktadır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Topladığımız Kişisel Bilgiler
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>İletişim bilgileri: ad, adres, fatura adresi, kargo adresi, telefon numarası, e-posta adresi</li>
                <li>Finansal bilgiler: kredi kartı bilgileri (tarafımızca görülmez veya saklanmaz), ödeme işlem detayları</li>
                <li>Hesap bilgileri: kullanıcı adı, parola, tercihler</li>
                <li>İşlem bilgileri: sepete eklediğiniz ürünler, satın alımlar, iade ve değişim kayıtları</li>
                <li>Cihaz bilgileri: IP adresi, tarayıcı bilgisi, çerez kayıtları</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Kişisel Bilgileri Nasıl Kullanırız?
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Siparişlerinizi oluşturmak, hazırlamak ve teslim etmek</li>
                <li>Ödeme işlemlerini gerçekleştirmek</li>
                <li>İade ve değişim taleplerini karşılamak</li>
                <li>Müşteri desteği sağlamak</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
                <li>Açık rızanız bulunması halinde kampanya iletileri göndermek</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Verilerin Aktarılması
              </h2>
              <p>
                Kişisel verileriniz yalnızca hizmetin sunulabilmesi için gerekli olduğu ölçüde kargo firmaları, ödeme kuruluşları ve yetkili kamu kurumlarına aktarılabilir. Verileriniz pazarlama amacıyla üçüncü kişilere satılmaz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Verilerin Saklanması
              </h2>
              <p>
                Verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri (ticari ve vergisel kayıtlar için 10 yıl) sona erene kadar muhafaza edilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Haklarınız
              </h2>
              <p>
                KVKK'nın 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme haklarına sahipsiniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                İletişim
              </h2>
              <p>
                Sultan Selim Mah. Sultan Selim Cad. No: 14/A, 34415 Kağıthane / İstanbul<br />
                +90 545 614 09 80<br />
                omerhaskuyumculuk@gmail.com
              </p>
            </section>

            <section>
              <p className="text-earth-500 text-xs">
                Son güncelleme: 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}