'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch, adminLogout } from '@/lib/adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await adminFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ id: userId, isActive: !currentStatus }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await adminFetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      fetchUsers();
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const fetchUserOrders = async (user) => {
    setSelectedUser(user);
    setLoadingOrders(true);
    setUserOrders([]);
    try {
      const res = await adminFetch(`/api/admin/orders?userId=${user._id}`);
      const data = await res.json();
      setUserOrders(data.orders || []);
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
    });
    setSaveMsg('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          id: editingUser._id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          password: editForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaveMsg('Kullanıcı güncellendi');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setSaveMsg(error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const handleLogout = () => {
    adminLogout();
  };

  const handleCreateUser = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateMsg('Ad, e-posta ve şifre zorunludur');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateMsg('Şifre en az 6 karakter olmalı');
      return;
    }
    setCreating(true);
    setCreateMsg('');
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ name: '', email: '', phone: '', password: '' });
        fetchUsers();
        setSaveMsg('Kullanıcı oluşturuldu');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setCreateMsg(data.error || 'Oluşturma hatası');
      }
    } catch (e) {
      setCreateMsg('Bağlantı hatası');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-earth-500 hover:text-earth-700">&larr; Dashboard</Link>
              <span className="font-serif text-lg font-bold text-earth-800">Kullanıcı Yönetimi</span>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">Çıkış Yap</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-bold text-earth-800">
            Kayıtlı Kullanıcılar ({users.length})
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600 transition-colors"
            >
              + Yeni Kullanıcı
            </button>
            <input
              type="text"
              placeholder="İsim, e-posta veya telefon ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 px-4 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {saveMsg && (
          <div className={`mb-4 p-3 rounded-sm text-sm ${saveMsg.includes('güncellendi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {saveMsg}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-earth-500">Yükleniyor...</span>
          </div>
        )}

        {!loading && filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-earth-400">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((u) => (
              <div key={u._id} className="bg-white rounded-lg shadow-sm p-6">
                {/* Başlık */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                      <span className="text-gold-700 text-lg font-bold">{u.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-earth-800">{u.name}</h3>
                      <p className="text-xs text-earth-400">
                        Kayıt: {new Date(u.createdAt).toLocaleDateString('tr-TR')} | ID: {u._id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive !== false ? 'Aktif' : 'Pasif'}
                    </span>
                    <button
                      onClick={() => fetchUserOrders(u)}
                      className="px-3 py-1 rounded-sm text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      Detay
                    </button>
                    <button
                      onClick={() => editingUser?._id === u._id ? setEditingUser(null) : startEdit(u)}
                      className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${
                        editingUser?._id === u._id ? 'bg-earth-200 text-earth-600' : 'bg-gold-100 text-gold-700 hover:bg-gold-200'
                      }`}
                    >
                      {editingUser?._id === u._id ? 'Kapat' : 'Düzenle'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(u._id, u.isActive !== false)}
                      className={`px-3 py-1 rounded-sm text-xs font-medium transition-colors ${
                        u.isActive !== false ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {u.isActive !== false ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-sm text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {/* Bilgiler (düzenlenemeyen) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-earth-400">E-posta</p>
                    <p className="text-earth-700">{u.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-400">Telefon</p>
                    <p className="text-earth-700">{u.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-400">Kayıt IP</p>
                    <p className="text-earth-700 font-mono text-xs">{u.ipAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-earth-400">Son Giriş IP</p>
                    <p className="text-earth-700 font-mono text-xs">{u.lastLoginIp || '-'}</p>
                  </div>
                </div>

                {/* Düzenleme formu */}
                {editingUser?._id === u._id && (
                  <div className="border-t border-earth-200 pt-4 mt-4">
                    <h4 className="font-semibold text-earth-800 mb-3">Kullanıcı Bilgilerini Düzenle</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-earth-500 mb-1">Ad Soyad</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-earth-500 mb-1">E-posta</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-earth-500 mb-1">Telefon</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-earth-500 mb-1">Şifre</label>
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          className="w-full px-3 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500 font-mono"
                          placeholder="Değiştirmek istemiyorsanız boş bırakın"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 text-sm text-earth-600 hover:text-earth-800"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="px-6 py-2 bg-gold-500 text-white text-sm rounded-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-earth-800">
                Müşteri Detayı
              </h2>
              <button
                onClick={() => { setSelectedUser(null); setUserOrders([]); }}
                className="text-earth-400 hover:text-earth-600"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-earth-50 rounded-lg">
              <div>
                <p className="text-xs text-earth-400">Ad Soyad</p>
                <p className="text-sm font-medium text-earth-800">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-earth-400">E-posta</p>
                <p className="text-sm text-earth-700">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-earth-400">Telefon</p>
                <p className="text-sm text-earth-700">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-earth-400">Toplam Sipariş</p>
                <p className="text-sm font-medium text-earth-800">{userOrders.length}</p>
              </div>
              <div>
                <p className="text-xs text-earth-400">Toplam Harcama</p>
                <p className="text-sm font-medium text-gold-600">
                  {userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString('tr-TR')} TL
                </p>
              </div>
            </div>

            {loadingOrders ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : userOrders.length === 0 ? (
              <div className="text-center py-8 text-earth-400">
                Henüz sipariş bulunmuyor.
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-earth-800 mb-3">Siparişler</h3>
                <div className="space-y-3">
                  {userOrders.map((order) => (
                    <div key={order._id} className="border border-earth-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-earth-800">
                          Sipariş #{order.orderNumber || order._id?.slice(-8)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                          order.orderStatus === 'refunded' ? 'bg-orange-100 text-orange-700' :
                          order.orderStatus === 'shipped' ? 'bg-purple-100 text-purple-700' :
                          order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.orderStatus === 'delivered' ? 'Teslim Edildi' :
                           order.orderStatus === 'cancelled' ? 'İptal' :
                           order.orderStatus === 'refunded' ? 'İade' :
                           order.orderStatus === 'shipped' ? 'Kargoda' :
                           order.orderStatus === 'processing' ? 'İşleniyor' :
                           order.orderStatus === 'pending' ? 'Bekliyor' : order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-earth-500">
                          {new Date(order.createdAt || order.date).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="font-medium text-gold-600">
                          {(order.totalAmount || 0).toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-earth-100">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-earth-500 py-0.5">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{((item.price || 0) * (item.quantity || 1)).toLocaleString('tr-TR')} TL</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {order.couponCode && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          Kupon: {order.couponCode} · -{(order.discountAmount || 0).toLocaleString('tr-TR')} TL
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setSelectedUser(null); setUserOrders([]); }}
                className="px-4 py-2 text-earth-600 hover:text-earth-800"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="font-serif text-xl font-bold text-earth-800 mb-4">Yeni Kullanıcı Oluştur</h2>

            {createMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-sm text-sm">{createMsg}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">E-posta *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input-field w-full"
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="input-field w-full"
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Şifre * (en az 6 karakter)</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input-field w-full"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setCreateMsg(''); setCreateForm({ name: '', email: '', phone: '', password: '' }); }}
                className="px-4 py-2 text-earth-600 hover:text-earth-800"
              >
                İptal
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                {creating ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
