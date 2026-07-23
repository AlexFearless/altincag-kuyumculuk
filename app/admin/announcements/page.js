'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', bgColor: '#B8860B', textColor: '#FFFFFF', isActive: true });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetchAnnouncements();
  }, [router]);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
      if (res.status === 401 || res.status === 403) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch { } finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', message: '', bgColor: '#B8860B', textColor: '#FFFFFF', isActive: true });
    setShowModal(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({ title: a.title, message: a.message, bgColor: a.bgColor || '#B8860B', textColor: a.textColor || '#FFFFFF', isActive: a.isActive });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      const url = '/api/admin/announcements';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { id: editing._id || editing.id, ...form } : form;
      await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` }, body: JSON.stringify(body) });
      setShowModal(false);
      fetchAnnouncements();
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
    fetchAnnouncements();
  }

  async function toggleActive(a) {
    await fetch('/api/admin/announcements', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      body: JSON.stringify({ id: a._id || a.id, isActive: !a.isActive }),
    });
    fetchAnnouncements();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="text-earth-500">Yükleniyor...</div></div>;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-earth-500 hover:text-gold-500">&larr; Dashboard</Link>
            <h1 className="text-2xl font-serif font-bold text-earth-800">Duyuru Yönetimi</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={openNew} className="bg-gold-500 text-white px-4 py-2 rounded-lg hover:bg-gold-600">+ Yeni Duyuru</button>
            <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login'); }} className="text-red-500 hover:text-red-700">Çıkış Yap</button>
          </div>
        </div>

        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-earth-500 text-lg">Henüz duyuru yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div key={a._id || a.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-earth-800">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-earth-600 text-sm mb-2">{a.message}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: a.bgColor }}></div>
                      <span className="text-xs text-earth-400">Arka plan rengi</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => toggleActive(a)} className="text-sm text-earth-500 hover:text-gold-500">{a.isActive ? 'Pasifleştir' : 'Aktifleştir'}</button>
                    <button onClick={() => openEdit(a)} className="text-sm text-earth-500 hover:text-gold-500">Düzenle</button>
                    <button onClick={() => handleDelete(a._id || a.id)} className="text-sm text-red-500 hover:text-red-700">Sil</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-serif font-bold text-earth-800 mb-4">{editing ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Başlık</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-earth-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none" placeholder="Örn: Yeni Sezon İndirimi!" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">Mesaj</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-earth-200 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none resize-none" placeholder="Duyuru mesajınız..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Arka Plan Rengi</label>
                    <div className="flex gap-2">
                      {['#B8860B', '#1E3A5F', '#7C2D12', '#065F46', '#7C3AED', '#000000'].map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, bgColor: c }))} className={`w-8 h-8 rounded-lg border-2 ${form.bgColor === c ? 'border-earth-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1">Yazı Rengi</label>
                    <div className="flex gap-2">
                      {['#FFFFFF', '#000000', '#B8860B', '#F5F5DC'].map(c => (
                        <button key={c} onClick={() => setForm(f => ({ ...f, textColor: c }))} className={`w-8 h-8 rounded-lg border-2 ${form.textColor === c ? 'border-earth-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <label className="text-sm text-earth-700">Aktif (sitede görünsün)</label>
                </div>
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-xs text-earth-400 mb-2">Önizleme:</p>
                  <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: form.bgColor, color: form.textColor }}>
                    <strong>{form.title || 'Duyuru Başlığı'}</strong>
                    <p className="text-sm opacity-90">{form.message || 'Duyuru mesajı burada görünecek...'}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-earth-600 hover:text-earth-800">İptal</button>
                <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.message.trim()} className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : editing ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
