'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${params.slug}`);
      if (!res.ok) {
        throw new Error('Ürün bulunamadı');
      }
      const data = await res.json();
      setProduct(data.product);

      if (data.product?.category) {
        const catRes = await fetch(`/api/products?category=${data.product.category}&limit=10`);
        if (catRes.ok) {
          const catData = await catRes.json();
          const filtered = catData.products.filter(p => p._id !== data.product._id);
          setRelatedProducts(filtered);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl text-earth-600 mb-2">Ürün bulunamadı</h2>
          <p className="text-earth-400">Aradığınız ürün bulunamadı veya kaldırılmış olabilir.</p>
        </div>
      </div>
    );
  }

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}
