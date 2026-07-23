'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link: '',
    image: '',
    sortOrder: 0,
    isActive: true,
  });

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchBanners();
  }, [router]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Bannerlar yüklenemedi:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      link: '',
      image: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBanner ? '/api/admin/banners' : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';
      const body = editingBanner
        ? { ...formData, id: editingBanner._id }
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
        setEditingBanner(null);
        resetForm();
        fetchBanners();
        setMessage({ text: editingBanner ? 'Banner güncellendi' : 'Banner oluşturuldu', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'İşlem başarısız', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Banner kaydedilemedi:', error);
      setMessage({ text: 'Bir hata oluştu', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu bannerı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchBanners();
        setMessage({ text: 'Banner silindi', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Banner silinemedi:', error);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: banner._id, isActive: !banner.isActive }),
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      image: banner.image || '',
      sortOrder: banner.sortOrder || 0,
      isActive: banner.isActive,
    });
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_info');
    router.push('/admin/login');
  };

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
                Banner Yönetimi
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setEditingBanner(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600 transition-colors"
              >
                + Yeni Banner
              </button>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message.text && (
          <div className={`mb-4 p-3 rounded-sm text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-earth-400">Henüz banner eklenmemiş.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex">
                  {banner.image && (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-48 h-32 object-cover"
                    />
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-earth-800">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="text-sm text-earth-500 mt-1">{banner.subtitle}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-earth-400">
                          {banner.link && <span>Link: {banner.link}</span>}
                          <span>Sıra: {banner.sortOrder}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            banner.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {banner.isActive ? 'Aktif' : 'Pasif'}
                        </button>
                        <button
                          onClick={() => handleEdit(banner)}
                          className="px-3 py-1 bg-gold-100 text-gold-700 rounded-sm text-xs font-medium hover:bg-gold-200 transition-colors"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-sm text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-earth-800">
                {editingBanner ? 'Banner Düzenle' : 'Yeni Banner Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBanner(null);
                  resetForm();
                }}
                className="text-earth-400 hover:text-earth-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Alt Başlık</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Görsel URL *</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="input-field"
                  required
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Link</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="input-field"
                  placeholder="/kategori/ad"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Sıralama</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-gold-500 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-earth-700">Aktif</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBanner(null);
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
                  {editingBanner ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
