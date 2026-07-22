'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchUsers(token);
  }, [router]);

  const fetchUsers = async (token) => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId, isActive: !currentStatus }),
      });
      fetchUsers(token);
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    try {
      await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(token);
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: user.password || '',
    });
    setSaveMsg('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    setSaveMsg('');
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      fetchUsers(token);
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
          <input
            type="text"
            placeholder="İsim, e-posta veya telefon ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 px-4 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
          />
        </div>

        {saveMsg && (
          <div className={`mb-4 p-3 rounded-sm text-sm ${saveMsg.includes('güncellendi') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {saveMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredUsers.length === 0 ? (
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
                          type="text"
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
    </div>
  );
}
