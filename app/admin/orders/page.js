'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminApi';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [whatsappUrl, setWhatsappUrl] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [router, filterStatus]);

  const fetchOrders = async () => {
    try {
      const url = filterStatus
        ? `/api/admin/orders?status=${filterStatus}`
        : '/api/admin/orders';
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) { router.push('/admin/login'); return; }
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
      const res = await adminFetch('/api/admin/orders', {
        method: 'PUT',
        body: JSON.stringify({ id: orderId, orderStatus: status }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.whatsappUrl) {
          setWhatsappUrl(data.whatsappUrl);
        }
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
      const res = await adminFetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
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
    refunded: 'İade Edildi',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-orange-100 text-orange-700',
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

      {whatsappUrl && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-green-200 p-4 max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-earth-800">WhatsApp Bildirimi</p>
              <p className="text-xs text-earth-500">Müşteriye durum mesajı gönder</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener"
              className="flex-1 py-2 bg-green-500 text-white text-center rounded-sm text-sm hover:bg-green-600 transition-colors"
            >
              WhatsApp'ta Aç
            </a>
            <button
              onClick={() => setWhatsappUrl(null)}
              className="px-3 py-2 text-earth-500 hover:text-earth-700 text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

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
          <button
            onClick={() => setFilterStatus('refunded')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterStatus === 'refunded' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-earth-600 hover:bg-earth-50 border border-earth-200'
            }`}
          >
            İade Edilenler
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-earth-500">Yükleniyor...</span>
          </div>
        )}

        {!loading && orders.length === 0 ? (
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
                      {order.customerInfo?.phone && (
                        <a
                          href={`https://wa.me/90${order.customerInfo.phone.replace(/[^0-9]/g, '').startsWith('0') ? order.customerInfo.phone.replace(/[^0-9]/g, '').slice(1) : order.customerInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Sayın ${order.customerInfo.firstName}, siparişiniz (#${order.orderNumber}) hakkında bilgilendirme. AltınÇağ Kuyumculuk`)}`}
                          target="_blank"
                          rel="noopener"
                          className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1"
                          title="WhatsApp'tan mesaj gönder"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
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
                  <p><span className="text-earth-500">Ödeme Durumu:</span> {(selectedOrder.paymentStatus === 'paid' || selectedOrder.paymentStatus === 'odendi') ? '✓ Ödendi' : '⏳ Beklemede'}</p>
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
                  <h4 className="text-sm font-semibold text-earth-700 mb-2">Ödeme Durumu</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await adminFetch('/api/admin/orders', {
                            method: 'PATCH',
                            body: JSON.stringify({ id: selectedOrder._id, paymentStatus: 'odendi' }),
                          });
                          if (res.ok) { fetchOrders(); setSelectedOrder(null); }
                        } catch (e) { console.error(e); }
                      }}
                      className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                        (selectedOrder.paymentStatus === 'odendi' || selectedOrder.paymentStatus === 'paid')
                          ? 'bg-green-500 text-white'
                          : 'bg-earth-100 text-earth-600 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      ✓ Ödendi
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await adminFetch('/api/admin/orders', {
                            method: 'PATCH',
                            body: JSON.stringify({ id: selectedOrder._id, paymentStatus: 'havale_bekliyor' }),
                          });
                          if (res.ok) { fetchOrders(); setSelectedOrder(null); }
                        } catch (e) { console.error(e); }
                      }}
                      className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                        selectedOrder.paymentStatus === 'havale_bekliyor'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-earth-100 text-earth-600 hover:bg-yellow-100 hover:text-yellow-700'
                      }`}
                    >
                      ⏳ Havale Bekleniyor
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-earth-200 flex gap-3">
                  {selectedOrder.customerInfo?.phone && (
                    <a
                      href={`https://wa.me/90${selectedOrder.customerInfo.phone.replace(/[^0-9]/g, '').startsWith('0') ? selectedOrder.customerInfo.phone.replace(/[^0-9]/g, '').slice(1) : selectedOrder.customerInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Sayın ${selectedOrder.customerInfo.firstName}, siparişiniz (#${selectedOrder.orderNumber}) hakkında bilgilendirme. AltınÇağ Kuyumculuk`)}`}
                      target="_blank"
                      rel="noopener"
                      className="px-4 py-2 bg-green-500 text-white rounded-sm text-sm font-medium hover:bg-green-600 transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
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
