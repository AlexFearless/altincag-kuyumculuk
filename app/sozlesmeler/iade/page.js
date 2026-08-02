export const metadata = {
  title: 'Para İade Politikası | Ömer Has Kuyumculuk',
};

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            Para İade Politikası
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600">
            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                14 Günlük Değişim Politikası
              </h2>
              <p>
                Ürününüzü aldıktan sonra 14 gün içinde değişim talebinde bulunabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Değişim Koşulları
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ürününüzün giyilmemiş veya kullanılmamış olması</li>
                <li>Etiketli ve orijinal ambalajında olması</li>
                <li>Makbuz veya satın alma belgesine sahip olmanız</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Değişim Başvurusu
              </h2>
              <p>
                omerhaskuyumculuk@gmail.com adresinden bizimle iletişime geçebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İstisnalar / İade Edilemeyen Ürünler
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Yüzük bedeninden kaynaklanan problemler iade kapsamı dışındadır.</strong> Lütfen bedeninizi doğru seçiniz.</li>
                <li>Kişisel bakım ürünleri</li>
                <li>Tehlikeli maddeler</li>
                <li>İndirimdeki ürünler</li>
                <li>Hediye kartları</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Hasarlı Ürünler
              </h2>
              <p>
                Siparişinizi teslim aldığınızda inceleyin. Ürün kusurlu veya hasarlıysa hemen bizimle iletişime geçin.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Para İadeleri
              </h2>
              <p>
                İadeniz kabul edildikten sonra 10 iş günü içinde orijinal ödeme yönteminize iade yapılır. 15 iş gününü aşan iadeler için omerhaskuyumculuk@gmail.com adresinden iletişime geçin.
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
