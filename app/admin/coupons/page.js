'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  });

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchCoupons();
  }, [router]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Kuponlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percent',
      discountValue: '',
      minOrderAmount: '',
      maxUses: '',
      expiresAt: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = editingCoupon
        ? { ...formData, id: editingCoupon._id }
        : formData;

      const res = await fetch('/api/admin/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setEditingCoupon(null);
        resetForm();
        fetchCoupons();
        setMessage({ text: editingCoupon ? 'Kupon güncellendi' : 'Kupon oluşturuldu', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: data.error || 'İşlem başarısız', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Kupon kaydedilemedi:', error);
      setMessage({ text: 'Bir hata oluştu', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchCoupons();
        setMessage({ text: 'Kupon silindi', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Kupon silinemedi:', error);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: coupon._id, isActive: !coupon.isActive }),
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxUses: coupon.maxUses || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      isActive: coupon.isActive,
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
                Kupon Yönetimi
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setEditingCoupon(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600 transition-colors"
              >
                + Yeni Kupon
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
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-earth-400">Henüz kupon eklenmemiş.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-earth-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Kod</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Tip</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Değer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Min. Sipariş</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Kullanım</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Son Kullanma</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-earth-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-earth-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-bold text-earth-800">{coupon.code}</span>
                      {coupon.description && (
                        <p className="text-xs text-earth-400 mt-1">{coupon.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-sm ${coupon.discountType === 'percent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {coupon.discountType === 'percent' ? 'Yüzde' : 'Sabit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-earth-800">
                      {coupon.discountType === 'percent' ? `%${coupon.discountValue}` : `${coupon.discountValue} TL`}
                    </td>
                    <td className="px-6 py-4 text-sm text-earth-500">
                      {coupon.minOrderAmount > 0 ? `${coupon.minOrderAmount.toLocaleString('tr-TR')} TL` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-earth-500">
                      {coupon.usedCount || 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-earth-500">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {coupon.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-gold-600 hover:text-gold-700 text-sm mr-3"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-earth-800">
                {editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="text-earth-400 hover:text-earth-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Kupon Kodu *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="input-field"
                  required
                  placeholder="ORNEK10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="10 indirim kuponu"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">İndirim Tipi *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="input-field"
                  >
                    <option value="percent">Yüzde (%)</option>
                    <option value="fixed">Sabit Tutar (TL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">İndirim Değeri *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                    placeholder={formData.discountType === 'percent' ? '10' : '50'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Min. Sipariş Tutarı (TL)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="input-field"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Maks. Kullanım</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="input-field"
                    min="0"
                    placeholder="Sınırsız"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Son Kullanma Tarihi</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="input-field"
                />
              </div>

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

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
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
                  {editingCoupon ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
