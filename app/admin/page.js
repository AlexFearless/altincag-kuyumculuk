'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, users: 0, unreadMessages: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    const adminInfo = localStorage.getItem('admin_info') || sessionStorage.getItem('admin_info');

    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (adminInfo) {
      setAdmin(JSON.parse(adminInfo));
    }

    fetchStats(token);
  }, [router]);

  const fetchStats = async (token) => {
    try {
      const [productsRes, ordersRes, usersRes, messagesRes] = await Promise.all([
        fetch('/api/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/messages', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const usersData = await usersRes.json();
      const messagesData = await messagesRes.json();

      setStats({
        products: productsData.total || 0,
        orders: ordersData.total || 0,
        revenue: ordersData.orders?.reduce((sum, o) => {
          if (o.orderStatus === 'cancelled') return sum;
          return sum + (o.totalAmount || 0);
        }, 0) || 0,
        users: usersData.total || 0,
        unreadMessages: messagesData.unreadCount || 0,
      });
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_info');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-serif text-lg font-bold text-earth-800">
                Admin Panel
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-earth-500">
                Hoş geldin, {admin?.name || 'Admin'}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500">Toplam Ürün</p>
                <p className="text-3xl font-bold text-earth-800">{stats.products}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <PackageIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500">Toplam Sipariş</p>
                <p className="text-3xl font-bold text-earth-800">{stats.orders}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500">Toplam Gelir</p>
                <p className="text-3xl font-bold text-earth-800">
                  {stats.revenue.toLocaleString('tr-TR')} TL
                </p>
              </div>
              <div className="p-3 bg-gold-50 rounded-lg">
                <CurrencyIcon className="w-6 h-6 text-gold-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500">Kayıtlı Kullanıcı</p>
                <p className="text-3xl font-bold text-earth-800">{stats.users}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <UsersIcon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-earth-500">Okunmamış Mesaj</p>
                <p className="text-3xl font-bold text-earth-800">{stats.unreadMessages}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <MailIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/products"
            className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group"
          >
            <PackageIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">
              Ürün Yönetimi
            </h3>
            <p className="text-earth-500 text-sm">
              Ürünleri ekle, düzenle veya sil. İndirim uygula.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group"
          >
            <ShoppingBagIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">
              Sipariş Yönetimi
            </h3>
            <p className="text-earth-500 text-sm">
              Gelen siparişleri görüntüle ve yönet.
            </p>
          </Link>

          <Link href="/admin/users" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <UsersIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Kullanıcı Yönetimi</h3>
            <p className="text-earth-500 text-sm">Kayıtlı kullanıcıları görüntüle ve yönet.</p>
          </Link>

          <Link href="/admin/messages" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <MailIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Mesaj Yönetimi</h3>
            <p className="text-earth-500 text-sm">İletişim formundan gelen mesajları yönet.</p>
          </Link>

          <Link href="/admin/logs" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <LogIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Aktivite Logları</h3>
            <p className="text-earth-500 text-sm">Admin işlemlerinin loglarını görüntüle.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PackageIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function CurrencyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function LogIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
