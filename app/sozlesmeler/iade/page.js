export const metadata = {
  title: 'İade Koşulları | Altınçag Kuyumculuk',
};

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-earth-800 mb-8">
            İade Koşulları
          </h1>

          <div className="prose prose-earth max-w-none space-y-6 text-earth-600">
            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İade Hakkı
              </h2>
              <p>
                Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde sebep göstermeksizin
                sözleşmeden cayma hakkına sahiptir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İade Koşulları
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ürün kullanılmamış olmalıdır</li>
                <li>Ürün hasar görmemiş olmalıdır</li>
                <li>Ürün orijinal ambalajında olmalıdır</li>
                <li>Ürün ile birlikte tüm aksesuarlar iade edilmelidir</li>
                <li>Fatura aslı ile birlikte iade edilmelidir</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İade İşlemi
              </h2>
              <p>
                İade talebiniz onaylandıktan sonra, ürününüz Satıcıya ulaştığında kontrol
                edilir. Uygun görülmesi halinde, iade tutarı 10 iş günü içinde
                Alıcının banka hesabına iade edilir.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-earth-800 mb-3">
                İade Edilemeyen Ürünler
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kişisel kullanıma yönelik ürünler (kulak piercing vb.)</li>
                <li>Sipariş üzerine üretilen ürünler</li>
                <li>Kullanılmış veya hasar görmüş ürünler</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
