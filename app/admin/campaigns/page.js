'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const categories = [
    { value: '', label: 'Kategori Seçin' },
    { value: 'yuzuk', label: 'Yüzük' },
    { value: 'kolye', label: 'Kolye' },
    { value: 'bileklik', label: 'Bileklik' },
    { value: 'kelepce', label: 'Kelepçe' },
    { value: 'kupe', label: 'Küpe' },
    { value: 'zincir', label: 'Zincir' },
    { value: 'set', label: 'Set' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    discountType: 'percent',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    appliesTo: 'all',
    targetCategory: '',
    targetProducts: [],
  });

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchCampaigns();
  }, [router]);

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    if (!campaign.isActive) return 'Pasif';
    if (now < start) return 'Yaklaşıyor';
    if (now > end) return 'Süresi Doldu';
    return 'Aktif';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-700';
      case 'Süresi Doldu': return 'bg-red-100 text-red-700';
      case 'Yaklaşıyor': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Kampanyalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      discountType: 'percent',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true,
      appliesTo: 'all',
      targetCategory: '',
      targetProducts: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = editingCampaign
        ? { ...formData, id: editingCampaign._id }
        : formData;

      const res = await fetch('/api/admin/campaigns', {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setEditingCampaign(null);
        resetForm();
        fetchCampaigns();
        setMessage({ text: editingCampaign ? 'Kampanya güncellendi' : 'Kampanya oluşturuldu', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: data.error || 'İşlem başarısız', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Kampanya kaydedilemedi:', error);
      setMessage({ text: 'Bir hata oluştu', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchCampaigns();
        setMessage({ text: 'Kampanya silindi', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error('Kampanya silinemedi:', error);
    }
  };

  const handleToggleActive = async (campaign) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: campaign._id, isActive: !campaign.isActive }),
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
      isActive: campaign.isActive,
      appliesTo: campaign.appliesTo,
      targetCategory: campaign.targetCategory || '',
      targetProducts: campaign.targetProducts || [],
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
                Kampanya Yönetimi
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setEditingCampaign(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600 transition-colors"
              >
                + Yeni Kampanya
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
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-earth-400">Henüz kampanya eklenmemiş.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-earth-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Kampanya Adı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">İndirim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Kapsam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Tarih Aralığı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-earth-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-earth-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {campaigns.map((campaign) => {
                  const status = getCampaignStatus(campaign);
                  return (
                    <tr key={campaign._id} className="hover:bg-earth-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-earth-800">{campaign.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-sm ${campaign.discountType === 'percent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {campaign.discountType === 'percent' ? `%${campaign.discountValue}` : `${campaign.discountValue} TL`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-earth-500">
                        {campaign.appliesTo === 'all' ? 'Tüm Ürünler' : campaign.appliesTo === 'category' ? `Kategori: ${campaign.targetCategory}` : 'Seçili Ürünler'}
                      </td>
                      <td className="px-6 py-4 text-sm text-earth-500">
                        {new Date(campaign.startDate).toLocaleDateString('tr-TR')} - {new Date(campaign.endDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(campaign)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${getStatusColor(status)}`}
                        >
                          {status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="text-gold-600 hover:text-gold-700 text-sm mr-3"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(campaign._id)}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                {editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCampaign(null);
                  resetForm();
                }}
                className="text-earth-400 hover:text-earth-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Kampanya Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Yaz İndirimi Kampanyası"
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
                  <label className="block text-sm font-medium text-earth-700 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Kapsam *</label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                  className="input-field"
                >
                  <option value="all">Tüm Ürünler</option>
                  <option value="category">Kategori</option>
                </select>
              </div>

              {formData.appliesTo === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Hedef Kategori</label>
                  <select
                    value={formData.targetCategory}
                    onChange={(e) => setFormData({ ...formData, targetCategory: e.target.value })}
                    className="input-field"
                    required
                  >
                    {categories.filter(c => c.value).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              )}

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
                    setEditingCampaign(null);
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
                  {editingCampaign ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
