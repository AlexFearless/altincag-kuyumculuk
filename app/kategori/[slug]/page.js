import CategoryPage from '@/components/CategoryPage';

export function generateMetadata({ params }) {
  const categoryNames = {
    yuzuk: 'Yüzük',
    kolye: 'Kolye',
    bileklik: 'Bileklik',
    kelepce: 'Kelepçe',
    kupe: 'Küpe',
    zincir: 'Zincir',
    set: 'Set',
  };

  return {
    title: `${categoryNames[params.slug] || params.slug} | AltınÇağ Kuyumculuk`,
    description: `AltınÇağ Kuyumculuk ${categoryNames[params.slug] || params.slug} koleksiyonu. Premium kalite altın takılar.`,
  };
}

export default function Category({ params }) {
  return <CategoryPage category={params.slug} />;
}
