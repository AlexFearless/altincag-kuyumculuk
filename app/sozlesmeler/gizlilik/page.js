export const metadata = {
  title: 'Gizlilik Politikası | AltınÇağ Kuyumculuk',
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
                AltınÇağ Kuyumculuk olarak, kişisel verilerinizin güvenliği konusunda hassasiyet gösteriyoruz. İşbu Gizlilik Politikası, web sitemizi ziyaret ettiğinizde veya hizmetlerimizi kullandığınızda kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Kişisel Bilgi Toplama
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>İletişim bilgileri: ad, soyad, adres, telefon numarası, e-posta adresi</li>
                <li>İşlem bilgileri: sipariş geçmişi, sepet işlemleri, iade ve değişim kayıtları</li>
                <li>Güvenlik bilgileri: IP adresi, çerez kayıtları, tarayıcı bilgisi</li>
                <li>Kredi kartı bilgileriniz tarafımızca saklanmaz; ödemeler lisanslı ödeme kuruluşları üzerinden gerçekleştirilir</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Bilgilerin Kullanım Amacı
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Sipariş süreçlerinin yürütülmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi (6098 sayılı TBK, 6502 sayılı TKHK, Vergi Usul Kanunu)</li>
                <li>Müşteri desteği sağlanması</li>
                <li>Açık rızanız olması halinde kampanya bilgilendirmeleri</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Üçüncü Taraflara Aktarım
              </h2>
              <p>
                Kişisel verileriniz yalnızca yasal zorunluluklar ve hizmet sunumu kapsamında kargo firmaları, ödeme kuruluşları ve yetkili kamu kurumlarıyla paylaşılabilir. Verileriniz satılmaz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Veri Saklama
              </h2>
              <p>
                Sipariş ve fatura kayıtları 10 yıl, diğer veriler hizmet süresince saklanır. Veri minimizasyonu ilkesine uygun hareket edilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Haklarınız (6698 sayılı KVKK md. 11)
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
                <li>Verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>İşlemlerin aktarıldığı üçüncü taraflara bildirilmesini isteme</li>
                <li>Otomatik analiz sonucu aleyhe çıkan sonuca itiraz etme</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Çerezler
              </h2>
              <p>
                Zorunlu çerezler (sepet, oturum) ve analitik çerezler kullanılmaktadır. Tarayıcı ayarlarından yönetebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                Güvenlik
              </h2>
              <p>
                Kişisel verileriniz SSL ile şifrelenerek iletilir. Verileriniz güvenli sunucularda saklanır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-semibold text-earth-800 mb-3">
                İletişim
              </h2>
              <p>
                Çağlayan, Vatan Cd. No:55/C, 34403 Kağıthane/İstanbul<br />
                (0212) 232 22 12<br />
                kuyumculukaltincag@gmail.com
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
