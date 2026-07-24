'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [discountModal, setDiscountModal] = useState(false);
  const [discountData, setDiscountData] = useState({
    category: '',
    discountPercent: 0,
    discountType: 'real',
    productIds: [],
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkPriceModal, setBulkPriceModal] = useState(false);
  const [bulkStockModal, setBulkStockModal] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkStockValue, setBulkStockValue] = useState('');
  const fileInputRef = useRef(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'yuzuk',
    stock: '',
    karat: '',
    weight: '',
    material: '',
    isFeatured: false,
    discountPercent: 0,
    discountType: '',
    images: [],
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchProducts();
  }, [router, filterCategory]);

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  const fetchProducts = async () => {
    try {
      const url = filterCategory
        ? `/api/admin/products?category=${filterCategory}`
        : '/api/admin/products';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const base64Images = [];

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        base64Images.push(reader.result);
        if (base64Images.length === files.length) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...base64Images],
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct ? '/api/admin/products' : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const body = editingProduct
        ? { ...formData, id: editingProduct._id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error('Ürün kaydedilemedi:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Ürün silinemedi:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category,
      stock: product.stock,
      karat: product.karat || '',
      weight: product.weight || '',
      material: product.material || '',
      isFeatured: product.isFeatured || false,
      discountPercent: product.discountPercent || 0,
      discountType: product.discountType || '',
      images: product.images || [],
    });
    setShowModal(true);
  };

  const handleApplyDiscount = async () => {
    try {
      const res = await fetch('/api/admin/discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(discountData),
      });

      if (res.ok) {
        setDiscountModal(false);
        setDiscountData({ category: '', discountPercent: 0, discountType: 'real', productIds: [] });
        fetchProducts();
      }
    } catch (error) {
      console.error('İndirim uygulanamadı:', error);
    }
  };

  const handleBulkUpdate = async (field, value) => {
    if (selectedProducts.length === 0) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          bulkUpdate: true,
          productIds: selectedProducts,
          field,
          value: Number(value),
        }),
      });
      if (res.ok) {
        setSelectedProducts([]);
        setBulkMode(false);
        setBulkPriceModal(false);
        setBulkStockModal(false);
        setBulkPriceValue('');
        setBulkStockValue('');
        fetchProducts();
      }
    } catch (error) {
      console.error('Toplu güncelleme hatası:', error);
    }
  };

  const toggleProductSelection = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p._id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'yuzuk',
      stock: '',
      karat: '',
      weight: '',
      material: '',
      isFeatured: false,
      discountPercent: 0,
      discountType: '',
      images: [],
    });
  };

  const categories = [
    { value: 'yuzuk', label: 'Yüzük' },
    { value: 'kolye', label: 'Kolye' },
    { value: 'bileklik', label: 'Bileklik' },
    { value: 'kelepce', label: 'Kelepçe' },
    { value: 'kupe', label: 'Küpe' },
    { value: 'zincir', label: 'Zincir' },
    { value: 'set', label: 'Set' },
  ];

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-earth-500 hover:text-earth-700">
                &larr; Dashboard
              </Link>
              <span className="font-serif text-lg font-bold text-earth-800">
                Ürün Yönetimi
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedProducts([]);
                }}
                className={`px-4 py-2 rounded-sm text-sm transition-colors ${
                  bulkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-earth-500 text-white hover:bg-earth-600'
                }`}
              >
                Toplu İşlem
              </button>
              <button
                onClick={() => setDiscountModal(true)}
                className="px-4 py-2 bg-earth-500 text-white rounded-sm text-sm hover:bg-earth-600 transition-colors"
              >
                İndirim Uygula
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingProduct(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600 transition-colors"
              >
                + Yeni Ürün
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-white border border-earth-200 rounded-sm text-sm"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {bulkMode && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-earth-700">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Tümünü Seç ({selectedProducts.length}/{products.length})</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBulkPriceModal(true)}
                disabled={selectedProducts.length === 0}
                className="px-4 py-2 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Toplu Fiyat Güncelle
              </button>
              <button
                onClick={() => setBulkStockModal(true)}
                disabled={selectedProducts.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-sm text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Toplu Stok Güncelle
              </button>
              <button
                onClick={() => { setSelectedProducts([]); setBulkMode(false); }}
                className="px-4 py-2 bg-earth-300 text-earth-700 rounded-sm text-sm hover:bg-earth-400 transition-colors"
              >
                Seçimi Kaldır
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-earth-50">
                <tr>
                  {bulkMode && (
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">
                    Fiyat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">
                    İndirim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-earth-500 uppercase">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {products.map((product) => (
                  <tr key={product._id} className={`hover:bg-earth-50 ${selectedProducts.includes(product._id) ? 'bg-blue-50' : ''}`}>
                    {bulkMode && (
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-sm object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-earth-100 rounded-sm mr-3" />
                        )}
                        <span className="text-sm font-medium text-earth-800 line-clamp-1">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-earth-500">
                      {categories.find((c) => c.value === product.category)?.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-earth-700">
                      {product.price.toLocaleString('tr-TR')} TL
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {product.discountPercent > 0 ? (
                        <span className={`px-2 py-1 rounded-sm ${product.discountType === 'real' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          %{product.discountPercent} {product.discountType === 'real' ? '✓' : ''}
                        </span>
                      ) : (
                        <span className="text-earth-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-sm ${
                          product.stock > 0
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-gold-600 hover:text-gold-700 text-sm mr-3"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-12 text-earth-400">
                Henüz ürün eklenmemiş.
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-earth-800">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="text-earth-400 hover:text-earth-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field resize-none h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Fiyat (TL) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="input-field"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="input-field"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    İndirim (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    İndirim Türü
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">İndirim Yok</option>
                    <option value="real">Gerçek İndirim (fiyat düşer)</option>
                    <option value="fake">Sahte İndirim (sadece üstü çizili göster)</option>
                  </select>
                </div>
                <div>
                  {formData.discountType === 'real' && formData.discountPercent > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        Satış Fiyatı: {formData.price ? (Number(formData.price) * (1 - formData.discountPercent / 100)).toFixed(2) : '0'} TL
                      </p>
                    </div>
                  )}
                  {formData.discountType === 'fake' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        Ürün fiyatı değişmez, eski fiyat üstü çizili gösterilir
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Ayar
                  </label>
                  <select
                    value={formData.karat}
                    onChange={(e) =>
                      setFormData({ ...formData, karat: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Seçiniz</option>
                    <option value="14">14 Ayar</option>
                    <option value="18">18 Ayar</option>
                    <option value="22">22 Ayar</option>
                    <option value="24">24 Ayar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Ağırlık (gr)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Malzeme
                  </label>
                  <select
                    value={formData.material}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Altın">Altın</option>
                    <option value="Gümüş">Gümüş</option>
                    <option value="Çelik">Çelik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  Görseller
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-6 border-2 border-dashed border-earth-300 rounded-lg text-sm text-earth-500 hover:border-gold-500 hover:text-gold-600 transition-colors w-full flex flex-col items-center gap-2"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Görsel Ekle
                </button>
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          alt={`Görsel ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="w-4 h-4 text-gold-500 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 text-sm text-earth-700">
                  Öne çıkan ürün olarak göster
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-earth-600 hover:text-earth-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors"
                >
                  {editingProduct ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h2 className="font-serif text-xl font-bold text-earth-800 mb-4">
              Toplu Fiyat Güncelle
            </h2>
            <p className="text-sm text-earth-500 mb-4">
              {selectedProducts.length} ürün seçildi
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-earth-700 mb-1">
                Yeni Fiyat (TL)
              </label>
              <input
                type="number"
                value={bulkPriceValue}
                onChange={(e) => setBulkPriceValue(e.target.value)}
                className="input-field"
                min="0"
                placeholder="Fiyat girin"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setBulkPriceModal(false); setBulkPriceValue(''); }}
                className="px-4 py-2 text-earth-600 hover:text-earth-800"
              >
                İptal
              </button>
              <button
                onClick={() => handleBulkUpdate('price', bulkPriceValue)}
                disabled={!bulkPriceValue || Number(bulkPriceValue) < 0}
                className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h2 className="font-serif text-xl font-bold text-earth-800 mb-4">
              Toplu Stok Güncelle
            </h2>
            <p className="text-sm text-earth-500 mb-4">
              {selectedProducts.length} ürün seçildi
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-earth-700 mb-1">
                Yeni Stok Miktarı
              </label>
              <input
                type="number"
                value={bulkStockValue}
                onChange={(e) => setBulkStockValue(e.target.value)}
                className="input-field"
                min="0"
                placeholder="Stok miktarı girin"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setBulkStockModal(false); setBulkStockValue(''); }}
                className="px-4 py-2 text-earth-600 hover:text-earth-800"
              >
                İptal
              </button>
              <button
                onClick={() => handleBulkUpdate('stock', bulkStockValue)}
                disabled={!bulkStockValue || Number(bulkStockValue) < 0}
                className="px-6 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {discountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="font-serif text-xl font-bold text-earth-800 mb-4">
              İndirim Uygula
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  Kategori (Tümüne uygula için boş bırakın)
                </label>
                <select
                  value={discountData.category}
                  onChange={(e) =>
                    setDiscountData({ ...discountData, category: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  İndirim Yüzdesi
                </label>
                <input
                  type="number"
                  value={discountData.discountPercent}
                  onChange={(e) =>
                    setDiscountData({
                      ...discountData,
                      discountPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input-field"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  İndirim Tipi
                </label>
                <select
                  value={discountData.discountType}
                  onChange={(e) =>
                    setDiscountData({ ...discountData, discountType: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="real">Gerçek İndirim (Fiyat Düşer)</option>
                  <option value="fake">Sahte İndirim (Görsel Only)</option>
                </select>
                <p className="text-xs text-earth-400 mt-1">
                  {discountData.discountType === 'fake'
                    ? 'Üstü çizili fiyat gösterilir ama satış fiyatı değişmez'
                    : 'Gerçek indirim uygulanır, satış fiyatı düşer'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setDiscountModal(false)}
                className="px-4 py-2 text-earth-600 hover:text-earth-800"
              >
                İptal
              </button>
              <button
                onClick={handleApplyDiscount}
                className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
