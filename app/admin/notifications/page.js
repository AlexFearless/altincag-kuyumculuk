'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchNotifications();
  }, [router, filterType]);

  const fetchNotifications = async () => {
    try {
      const url = filterType
        ? `/api/admin/notifications?type=${filterType}`
        : '/api/admin/notifications';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id, isRead: true }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Okundu işareti hatası:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Tümünü okundu işaretleme hatası:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
    }
  };

  const typeIcons = {
    low_stock: '📦',
    new_order: '🛒',
    new_message: '💬',
    new_user: '👤',
    system: '⚙️',
  };

  const typeLabels = {
    low_stock: 'Stok Uyarısı',
    new_order: 'Yeni Sipariş',
    new_message: 'Yeni Mesaj',
    new_user: 'Yeni Üye',
    system: 'Sistem',
  };

  const typeColors = {
    low_stock: 'bg-yellow-100 text-yellow-700',
    new_order: 'bg-green-100 text-green-700',
    new_message: 'bg-blue-100 text-blue-700',
    new_user: 'bg-purple-100 text-purple-700',
    system: 'bg-earth-100 text-earth-700',
  };

  const filterTypes = [
    { key: '', label: 'Tümü' },
    { key: 'low_stock', label: 'Stok Uyarısı' },
    { key: 'new_order', label: 'Yeni Sipariş' },
    { key: 'new_message', label: 'Yeni Mesaj' },
    { key: 'new_user', label: 'Yeni Üye' },
    { key: 'system', label: 'Sistem' },
  ];

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
                Bildirimler
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} yeni
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-earth-200 text-earth-700 rounded-sm text-sm hover:bg-earth-300 transition-colors"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
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

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {filterTypes.map((ft) => (
            <button
              key={ft.key}
              onClick={() => setFilterType(ft.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterType === ft.key
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-earth-400">Bildirim bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`bg-white rounded-lg shadow-sm p-4 flex items-start space-x-4 transition-all ${
                  !notif.isRead ? 'ring-2 ring-gold-200 bg-gold-50/30' : ''
                }`}
              >
                <div className="text-2xl flex-shrink-0 mt-1">
                  {typeIcons[notif.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[notif.type] || 'bg-earth-100 text-earth-700'}`}>
                        {typeLabels[notif.type] || notif.type}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-gold-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-earth-400">
                      {new Date(notif.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-earth-800">{notif.title}</p>
                  {notif.message && (
                    <p className="text-sm text-earth-500 mt-1">{notif.message}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                    >
                      Okundu
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
