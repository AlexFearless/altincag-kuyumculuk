'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, users: 0, unreadMessages: 0 });
  const [authChecked, setAuthChecked] = useState(false);
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

    setAuthChecked(true);
    fetchStats(token);
  }, [router]);

  const fetchStats = async (token) => {
    try {
      const [productsRes, ordersRes, usersRes, messagesRes] = await Promise.allSettled([
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const get = (r) => r.status === 'fulfilled' ? r.value.json() : Promise.resolve({});

      const [productsData, ordersData, usersData, messagesData] = await Promise.all([
        get(productsRes), get(ordersRes), get(usersRes), get(messagesRes),
      ]);

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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_info');
    router.push('/admin/login');
  };

  if (!authChecked) {
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

          <Link href="/admin/coupons" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <CouponIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Kupon Yönetimi</h3>
            <p className="text-earth-500 text-sm">İndirim kuponları oluştur ve yönet.</p>
          </Link>

          <Link href="/admin/categories" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <CategoryIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Kategori Yönetimi</h3>
            <p className="text-earth-500 text-sm">Kategorileri ekle, düzenle veya sil.</p>
          </Link>

          <Link href="/admin/banners" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <BannerIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Banner Yönetimi</h3>
            <p className="text-earth-500 text-sm">Ana sayfa bannerlarını yönet.</p>
          </Link>

          <Link href="/admin/reports" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <ReportIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Satış Raporları</h3>
            <p className="text-earth-500 text-sm">Günlük, aylık satış istatistikleri.</p>
          </Link>

          <Link href="/admin/store-settings" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <SettingsIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Mağaza Ayarları</h3>
            <p className="text-earth-500 text-sm">Mağaza bilgileri, sosyal medya, duyurular.</p>
          </Link>

          <Link href="/admin/notifications" className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow group">
            <BellIcon className="w-12 h-12 text-earth-300 group-hover:text-gold-500 transition-colors mb-4" />
            <h3 className="font-serif text-xl font-semibold text-earth-800 mb-2">Bildirimler</h3>
            <p className="text-earth-500 text-sm">Sistem bildirimlerini görüntüle.</p>
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

function CouponIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  );
}

function CategoryIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function BannerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

function ReportIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
