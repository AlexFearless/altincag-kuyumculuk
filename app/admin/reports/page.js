'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    monthOrders: 0,
    monthRevenue: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [statusBreakdown, setStatusBreakdown] = useState({});
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [profitData, setProfitData] = useState({ totalCost: 0, totalProfit: 0 });
  const router = useRouter();

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchReportData(token);
  }, [router]);

  const fetchReportData = async (token) => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/admin/orders?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const allOrders = ordersData.orders || [];

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart && o.orderStatus !== 'cancelled');
      const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart && o.orderStatus !== 'cancelled');

      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalRevenue = allOrders.filter(o => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const breakdown = {};
      allOrders.forEach(o => {
        const status = o.orderStatus || 'pending';
        breakdown[status] = (breakdown[status] || 0) + 1;
      });

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        monthOrders: monthOrders.length,
        monthRevenue,
        totalOrders: allOrders.length,
        totalRevenue,
      });
      setOrders(allOrders.slice(0, 10));
      setStatusBreakdown(breakdown);
      setLowStockProducts(statsData.lowStockProducts || []);
      setTopSellingProducts(statsData.topSellingProducts || []);
      setProfitData({ totalCost: statsData.totalCost || 0, totalProfit: statsData.totalProfit || 0 });
    } catch (error) {
      console.error('Rapor verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    pending: 'Beklemede',
    processing: 'İşleniyor',
    shipped: 'Kargoya Verildi',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_info');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_info');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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
                Satış Raporları
              </span>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">
              Çıkış Yap
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center mb-6">
            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-earth-500">Veriler yükleniyor...</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Bugünün Siparişleri</p>
            <p className="text-3xl font-bold text-earth-800">{stats.todayOrders}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Bu Ayın Siparişleri</p>
            <p className="text-3xl font-bold text-earth-800">{stats.monthOrders}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Toplam Sipariş</p>
            <p className="text-3xl font-bold text-earth-800">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Bugünün Geliri</p>
            <p className="text-3xl font-bold text-gold-600">{stats.todayRevenue.toLocaleString('tr-TR')} TL</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Bu Ayın Geliri</p>
            <p className="text-3xl font-bold text-gold-600">{stats.monthRevenue.toLocaleString('tr-TR')} TL</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Toplam Gelir</p>
            <p className="text-3xl font-bold text-gold-600">{stats.totalRevenue.toLocaleString('tr-TR')} TL</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Toplam Maliyet</p>
            <p className="text-3xl font-bold text-orange-600">{profitData.totalCost.toLocaleString('tr-TR')} TL</p>
          </div>
          <div className={`bg-white rounded-lg p-6 shadow-sm border-2 ${profitData.totalProfit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
            <p className="text-sm text-earth-500 mb-1">Toplam Kâr / Zarar</p>
            <p className={`text-3xl font-bold ${profitData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitData.totalProfit >= 0 ? '+' : ''}{profitData.totalProfit.toLocaleString('tr-TR')} TL
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-sm text-earth-500 mb-1">Kâr Marjı</p>
            <p className={`text-3xl font-bold ${stats.totalRevenue > 0 && profitData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalRevenue > 0 ? ((profitData.totalProfit / stats.totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="font-serif text-lg font-bold text-red-800 mb-4">Düşük Stok Uyarısı</h3>
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                  <span className="text-sm font-medium text-earth-800">{product.name}</span>
                  <span className={`text-sm font-bold ${product.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                    {product.stock === 0 ? 'Tükendi' : `${product.stock} adet kaldı`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topSellingProducts.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <h3 className="font-serif text-lg font-bold text-earth-800 mb-4">En Çok Satılan Ürünler</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-earth-100">
                    <th className="text-left py-3 px-2 text-earth-500 font-medium">#</th>
                    <th className="text-left py-3 px-2 text-earth-500 font-medium">Ürün</th>
                    <th className="text-right py-3 px-2 text-earth-500 font-medium">Satış Adedi</th>
                    <th className="text-right py-3 px-2 text-earth-500 font-medium">Gelir</th>
                    <th className="text-right py-3 px-2 text-earth-500 font-medium">Maliyet</th>
                    <th className="text-right py-3 px-2 text-earth-500 font-medium">Kâr</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellingProducts.map((product, idx) => (
                    <tr key={product.id} className="border-b border-earth-50 hover:bg-earth-50/50">
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-gold-500 text-white' :
                          idx === 1 ? 'bg-earth-400 text-white' :
                          idx === 2 ? 'bg-amber-600 text-white' :
                          'bg-earth-100 text-earth-600'
                        }`}>{idx + 1}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-earth-100 flex items-center justify-center">
                              <PackageIcon className="w-5 h-5 text-earth-400" />
                            </div>
                          )}
                          <span className="font-medium text-earth-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-earth-800">{product.totalQuantity} adet</td>
                      <td className="py-3 px-2 text-right font-medium text-gold-600">{product.totalRevenue.toLocaleString('tr-TR')} TL</td>
                      <td className="py-3 px-2 text-right text-orange-500">{(product.totalCost || 0).toLocaleString('tr-TR')} TL</td>
                      <td className={`py-3 px-2 text-right font-bold ${(product.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(product.totalProfit || 0) >= 0 ? '+' : ''}{(product.totalProfit || 0).toLocaleString('tr-TR')} TL
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-lg font-bold text-earth-800 mb-4">Sipariş Durumu Dağılımı</h2>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-sm text-xs font-medium ${statusColors[status] || 'bg-earth-100 text-earth-700'}`}>
                      {statusLabels[status] || status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-earth-100 rounded-full h-2">
                      <div
                        className="bg-gold-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-earth-800 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-serif text-lg font-bold text-earth-800 mb-4">Son 10 Sipariş</h2>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="flex items-center justify-between py-2 border-b border-earth-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-earth-800">#{order.orderNumber}</p>
                    <p className="text-xs text-earth-400">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-earth-800">{order.totalAmount?.toLocaleString('tr-TR')} TL</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.orderStatus] || 'bg-earth-100 text-earth-700'}`}>
                      {statusLabels[order.orderStatus] || order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-sm text-earth-400 text-center py-4">Henüz sipariş yok</p>
              )}
            </div>
          </div>
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
