export const metadata = {
  title: 'Kargo Politikası | AltınÇağ Kuyumculuk',
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
                Teslimat Bölgesi
              </h2>
              <p>
                Sadece İstanbul iline kargo yapılmaktadır. İstanbul dışı adreslere teslimat gerçekleştirilmemektedir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Anlaşmalı Kargo Firması
              </h2>
              <p>
                Siparişleriniz MNG Kargo ile gönderilmektedir. Kargo takip numaranız sipariş onay e-postası ve SMS ile bildirilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo Süreci
              </h2>
              <p>
                Siparişleriniz, banka onayı alındıktan sonra İstanbul içindeki adresinize kargoya verilir. Teslimat, adrese göre 1-3 iş günü içinde gerçekleşir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Üretim Süreci
              </h2>
              <p>
                Ürünün üretime girmesi gerekiyorsa veya sipariş verdiğiniz ürün stokta bulunmuyorsa, üretim süreci 7-30 gün arasında değişiklik gösterebilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Adres Sorumluluğu
              </h2>
              <p>
                Adresin tarafımıza yanlış iletilmesi halinde, ürünün teslimi ya da teslimde yaşanacak gecikmelerden firmamız sorumlu değildir. Üyelik bilgilerinizin doğru ve güncel olması önemlidir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo Takibi
              </h2>
              <p>
                Ürününüz kargo şirketine teslim edildiğinde SMS ile bilgilendirme yapılır. Takip numaranızla kargo durumunu sorgulayabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Stok Tükenmesi
              </h2>
              <p>
                Aynı anda birden fazla kullanıcı tarafından satın alınma durumunda stok tükenmesi oluşabilir. Bu durumda en az 7, en fazla 30 gün bekleme süresi geçerlidir. Ürün temin edilemezse ödeme iade edilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Bayram ve Tatil Günleri
              </h2>
              <p>
                Bayram ve resmi tatil günlerinde teslimat yapılmamaktadır. Yoğunluk dönemlerinde gecikmeler yaşanabilir.
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
