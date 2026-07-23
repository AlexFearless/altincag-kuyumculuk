'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchOrders();
  }, [router, filterStatus]);

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  const fetchOrders = async () => {
    try {
      const url = filterStatus
        ? `/api/admin/orders?status=${filterStatus}`
        : '/api/admin/orders';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ id: orderId, orderStatus: status }),
      });

      if (res.ok) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Sipariş güncellenemedi:', error);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('Bu siparişi silmek istediğinize emin misiniz? Stoklar iade edilecektir.')) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Sipariş silinemedi:', error);
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
                Sipariş Yönetimi
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-earth-800">{orders.length}</p>
              <p className="text-xs text-earth-500">Toplam</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.orderStatus === 'pending').length}</p>
              <p className="text-xs text-earth-500">Bekleyen</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.orderStatus === 'shipped').length}</p>
              <p className="text-xs text-earth-500">Kargoda</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.orderStatus === 'delivered').length}</p>
              <p className="text-xs text-earth-500">Teslim</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-earth-200 rounded-sm text-sm"
          >
            <option value="">Tüm Siparişler</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterStatus === '' ? 'bg-gold-500 text-white shadow-md' : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterStatus === 'pending' ? 'bg-yellow-500 text-white shadow-md' : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
            }`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => setFilterStatus('delivered')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterStatus === 'delivered' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
            }`}
          >
            Teslim Edilenler
          </button>
          <button
            onClick={() => setFilterStatus('shipped')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterStatus === 'shipped' ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
            }`}
          >
            Kargodakiler
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterStatus === 'cancelled' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
            }`}
          >
            İptal Edilenler
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-earth-400">Henüz sipariş bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div>
                        <p className="font-semibold text-earth-800">
                          #{order.orderNumber}
                        </p>
                        <p className="text-sm text-earth-500">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-sm text-sm font-medium ${
                          statusColors[order.orderStatus]
                        }`}
                      >
                        {statusLabels[order.orderStatus]}
                      </span>
                      <div className="text-right">
                        {order.couponCode && (
                          <p className="text-xs text-green-600 font-medium">
                            {order.couponCode} · -{order.discountAmount?.toLocaleString('tr-TR') || '0'} TL
                          </p>
                        )}
                        <span className="font-bold text-earth-800">
                          {order.totalAmount.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-gold-600 hover:text-gold-700 text-sm font-medium"
                      >
                        Detay
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-6 text-sm text-earth-500">
                    <span>
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </span>
                    <span>{order.customerInfo.phone}</span>
                    <span>{order.customerInfo.email}</span>
                  </div>

                  {order.specialInstructions && (
                    <div className="mt-3 bg-gold-50 p-3 rounded-sm">
                      <p className="text-xs text-gold-600 font-medium mb-1">
                        Siparişe Özel Talimatlar:
                      </p>
                      <p className="text-sm text-earth-700">
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-earth-800">
                Sipariş Detayı - #{selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-earth-400 hover:text-earth-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-earth-800 mb-2">Müşteri Bilgileri</h3>
                <div className="bg-earth-50 p-4 rounded-sm text-sm space-y-1">
                  <p>
                    <span className="text-earth-500">Ad Soyad:</span>{' '}
                    {selectedOrder.customerInfo.firstName}{' '}
                    {selectedOrder.customerInfo.lastName}
                  </p>
                  <p>
                    <span className="text-earth-500">E-posta:</span>{' '}
                    {selectedOrder.customerInfo.email}
                  </p>
                  <p>
                    <span className="text-earth-500">Telefon:</span>{' '}
                    {selectedOrder.customerInfo.phone}
                  </p>
                  <p>
                    <span className="text-earth-500">Adres:</span>{' '}
                    {selectedOrder.customerInfo.address},{' '}
                    {selectedOrder.customerInfo.district}/{selectedOrder.customerInfo.city}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-earth-800 mb-2">Sipariş Özeti</h3>
                <div className="bg-earth-50 p-4 rounded-sm text-sm space-y-1">
                  <p><span className="text-earth-500">Sipariş No:</span> #{selectedOrder.orderNumber}</p>
                  <p><span className="text-earth-500">Tarih:</span> {new Date(selectedOrder.createdAt).toLocaleString('tr-TR')}</p>
                  <p><span className="text-earth-500">Ödeme:</span> {selectedOrder.paymentMethod === 'kapida' ? 'Kapıda Ödeme' : selectedOrder.paymentMethod === 'havale' ? 'Havale/EFT' : 'Kredi Kartı'}</p>
                  <p><span className="text-earth-500">Ödeme Durumu:</span> {selectedOrder.paymentStatus === 'paid' ? '✓ Ödendi' : '⏳ Beklemede'}</p>
                  {selectedOrder.guestId && <p><span className="text-earth-500">Kullanıcı ID:</span> {selectedOrder.guestId}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-earth-800 mb-2">Sipariş Ürünleri</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-earth-50 p-3 rounded-sm"
                    >
                      <div className="flex items-center">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-sm object-cover mr-3"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-earth-800">
                            {item.name}
                          </p>
                          <p className="text-xs text-earth-500">
                            {item.quantity} x {item.price?.toLocaleString('tr-TR')} TL
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-earth-700">
                        {((item.price || 0) * item.quantity).toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.specialInstructions && (
                <div>
                  <h3 className="font-semibold text-earth-800 mb-2">
                    Siparişe Özel Talimatlar
                  </h3>
                  <div className="bg-gold-50 p-4 rounded-sm">
                    <p className="text-sm text-earth-700">
                      {selectedOrder.specialInstructions}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-earth-500">Ara Toplam</span>
                  <span>{selectedOrder.subtotal?.toLocaleString('tr-TR')} TL</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-earth-500">Kargo</span>
                  <span>{selectedOrder.shippingCost?.toLocaleString('tr-TR')} TL</span>
                </div>
                {selectedOrder.couponCode && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600 font-medium">
                      Kupon: {selectedOrder.couponCode}
                    </span>
                    <span className="text-green-600 font-medium">
                      -{selectedOrder.discountAmount?.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam</span>
                  <span className="text-gold-600">
                    {selectedOrder.totalAmount?.toLocaleString('tr-TR')} TL
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-earth-800 mb-2">Sipariş Durumu</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => updateOrderStatus(selectedOrder._id, value)}
                      className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                        selectedOrder.orderStatus === value
                          ? 'bg-gold-500 text-white'
                          : 'bg-earth-100 text-earth-600 hover:bg-earth-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-earth-200">
                  <button
                    onClick={() => { deleteOrder(selectedOrder._id); }}
                    className="px-4 py-2 bg-red-500 text-white rounded-sm text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Siparişi Sil (Stok İade)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
