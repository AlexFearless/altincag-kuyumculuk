export const metadata = {
  title: 'Kargo Politikası | Ömer Has Kuyumculuk',
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
                Kargo Süreci
              </h2>
              <p>
                Siparişleriniz, banka onayı alındıktan sonra vermiş olduğunuz İstanbul adresine iletilmek üzere kargoya teslim edilir. Teslimat adresinin kargo şubesine uzaklığına göre kargo şirketi 1-3 gün içerisinde siparişinizi size ulaştıracaktır.
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
                Adresin tarafımıza yanlış iletilmesi halinde, ürünün teslimi ya da teslimde yaşanacak gecikmelerden firmamız sorumlu değildir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Kargo Takibi
              </h2>
              <p>
                Ürününüz kargo şirketine teslim edildiğinde, kargo firması tarafından size ürün takibi için SMS ile bilgilendirme yapılacaktır.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Stok Tükenmesi
              </h2>
              <p>
                Aynı ürünün aynı anda birden fazla kullanıcı tarafından satın alınması ve stokların tükenmesi söz konusu olabilir. Bu durumda, stoğumuzda kalmamış ürünler için en az 7, en fazla 30 günlük bekleme süresi geçerlidir. Ürün bu süre içerisinde temin edilemezse, yapılan ödeme müşteriye iade edilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                Bayram ve Tatil Günleri
              </h2>
              <p>
                Bayram ve resmi tatil günlerinde teslimat yapılmamaktadır. Bayram dönemlerindeki yoğunluk nedeniyle yaşanabilecek teslimat gecikmelerinden firmamız sorumlu tutulamaz.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İletişim
              </h2>
              <p>
                omerhaskuyumculuk@gmail.com
                <br />
                +90 545 614 09 80
                <br />
                Sultan Selim Mah. Sultan Selim Cad. No: 14/A, 34415 Kağıthane / İstanbul
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
