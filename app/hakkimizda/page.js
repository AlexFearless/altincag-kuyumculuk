export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-earth-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-earth-800">
            Hakkımızda
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg p-8 lg:p-12 shadow-sm mb-8">
            <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6">
              Altınçag Kuyumculuk Hikayesi
            </h2>
            <p className="text-earth-600 leading-relaxed mb-4">
              2025 yılında İstanbul'da kurulan Altınçag Kuyumculuk, kaliteli altın takıları
              müşterileriyle buluşturmayı hedefleyen bir aile işletmesidir. Kurulduğumuz günden bu yana,
              ustalık ve tutkuyla her bir parçaya hayat veriyoruz.
            </p>
            <p className="text-earth-600 leading-relaxed mb-4">
              Misyonumuz, en kaliteli malzemeleri kullanarak, modern tasarım anlayışıyla
              birleştirmek ve müşterilerimize benzersiz takılar sunmaktır. Her bir ürünümüz,
              deneyimli ustalarımızın ellerinden geçerek mükemmel bir işçilikle hazırlanır.
            </p>
            <p className="text-earth-600 leading-relaxed">
              Müşteri memnuniyetini her şeyin üstünde tutan anlayışımızla, satış sonrası
              hizmetlerimizle de yanınızdayız. Güvenilir, şeffaf ve kaliteli hizmet
              anlayışımızla sizleri mağazamızda ağırlamaktan mutluluk duyarız.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-gold-600 mb-2">5+</div>
              <p className="text-earth-600">Yıllık Tecrübe</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-gold-600 mb-2">10K+</div>
              <p className="text-earth-600">Mutlu Müşteri</p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-4xl font-bold text-gold-600 mb-2">500+</div>
              <p className="text-earth-600">Ürün Çeşidi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
