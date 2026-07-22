'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';


export default function AccountPage() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: { street: '', city: 'İstanbul', district: '', zipCode: '' },
  });

  useEffect(() => {
    if (!user) {
      router.push('/giris');
      return;
    }
    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || 'İstanbul',
        district: user.address?.district || '',
        zipCode: user.address?.zipCode || '',
      },
    });
    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/user/orders?email=${user.email}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          email: profileForm.email,
          address: profileForm.address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        sessionStorage.setItem('user_info', JSON.stringify(updatedUser));
        setSaveMsg('Profiliniz güncellendi');
      } else {
        setSaveMsg(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      setSaveMsg('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const statusLabels = {
    pending: 'Beklemede',
    processing: 'Hazırlanıyor',
    shipped: 'Kargoda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal Edildi',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="font-serif text-2xl font-bold text-earth-800">Hesabım</h1>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-center pb-4 mb-4 border-b border-earth-100">
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-serif font-bold text-gold-600">{user?.name?.charAt(0) || 'A'}</span>
                </div>
                <p className="font-semibold text-earth-800 text-sm">{user?.name}</p>
                <p className="text-xs text-earth-400 mt-0.5">{user?.email}</p>
                {user?.phone && <p className="text-xs text-earth-400">{user.phone}</p>}
              </div>

              <div className="space-y-1">
                {[
                  { key: 'orders', label: 'Siparişlerim', icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )},
                  { key: 'settings', label: 'Hesap Ayarları', icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )},
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-sm text-sm font-medium transition-colors flex items-center space-x-2.5 ${
                      tab === item.key ? 'bg-gold-50 text-gold-700' : 'text-earth-600 hover:bg-earth-50'
                    }`}
                  >
                    <span className={tab === item.key ? 'text-gold-600' : 'text-earth-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}

                <div className="border-t border-earth-100 my-2"></div>

                <Link href="/begeni" className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-medium transition-colors flex items-center space-x-2.5 text-earth-600 hover:bg-earth-50">
                  <svg className="w-4 h-4 text-earth-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>Beğenilerim</span>
                </Link>

                <Link href="/kargo-takip" className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-medium transition-colors flex items-center space-x-2.5 text-earth-600 hover:bg-earth-50">
                  <svg className="w-4 h-4 text-earth-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span>Kargo Takip</span>
                </Link>

                <Link href="/destek" className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-medium transition-colors flex items-center space-x-2.5 text-earth-600 hover:bg-earth-50">
                  <svg className="w-4 h-4 text-earth-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                  <span>Destek</span>
                </Link>

                <Link href="/iletisim" className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-medium transition-colors flex items-center space-x-2.5 text-earth-600 hover:bg-earth-50">
                  <svg className="w-4 h-4 text-earth-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span>İletişim</span>
                </Link>
              </div>

              <div className="border-t border-earth-100 mt-4 pt-4">
                <button onClick={logout} className="w-full text-left px-3 py-2.5 rounded-sm text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center space-x-2.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            {tab === 'orders' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="font-serif text-xl font-semibold text-earth-800 mb-6">Siparişlerim</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-earth-400">Henüz siparişiniz yok.</p>
                    <Link href="/" className="text-gold-600 hover:text-gold-700 text-sm mt-2 inline-block">Alışverişe Başla →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-earth-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-earth-800">Sipariş #{order.orderNumber}</p>
                            <p className="text-xs text-earth-400">
                              {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}>
                            {statusLabels[order.orderStatus]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center space-x-2 bg-earth-50 px-2 py-1 rounded">
                              {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />}
                              <span className="text-xs text-earth-600">{item.name} x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-earth-100">
                          <p className="text-xs text-earth-400">Toplam</p>
                          <p className="font-bold text-gold-600">{order.totalAmount.toLocaleString('tr-TR')} TL</p>
                        </div>
                        {order.specialInstructions && (
                          <div className="mt-2 bg-gold-50 p-2 rounded text-xs text-earth-600">
                            📝 {order.specialInstructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="font-serif text-xl font-semibold text-earth-800 mb-6">Hesap Bilgileri</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-earth-700 mb-1">Ad Soyad</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-earth-700 mb-1">E-posta</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="border-t border-earth-200 pt-4 mt-4">
                    <h3 className="font-serif text-lg font-semibold text-earth-800 mb-4">Kayıtlı Adres</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-earth-700 mb-1">Açık Adres</label>
                        <textarea
                          value={profileForm.address.street}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, address: { ...profileForm.address, street: e.target.value } })
                          }
                          placeholder="Mahalle, Cadde, Bina No, Daire No"
                          className="input-field resize-none h-20"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-earth-700 mb-1">İl</label>
                          <input
                            type="text"
                            value={profileForm.address.city}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, address: { ...profileForm.address, city: e.target.value } })
                            }
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-earth-700 mb-1">İlçe</label>
                          <input
                            type="text"
                            value={profileForm.address.district}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, address: { ...profileForm.address, district: e.target.value } })
                            }
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-earth-700 mb-1">Posta Kodu</label>
                          <input
                            type="text"
                            value={profileForm.address.zipCode}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, address: { ...profileForm.address, zipCode: e.target.value } })
                            }
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {saveMsg && (
                    <p className={`text-sm ${saveMsg.includes('güncellendi') ? 'text-green-600' : 'text-red-600'}`}>
                      {saveMsg}
                    </p>
                  )}

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gold-500 text-white px-6 py-2.5 rounded-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
