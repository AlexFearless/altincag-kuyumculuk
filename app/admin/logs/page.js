'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetchLogs(token);
  }, [router, page]);

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  const fetchLogs = async (token) => {
    try {
      const res = await fetch(`/api/admin/logs?page=${page}&limit=30`, {
        headers: { Authorization: `Bearer ${token || getToken()}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Loglar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionColors = {
    'Ürün eklendi': 'bg-green-100 text-green-700',
    'Ürün güncellendi': 'bg-blue-100 text-blue-700',
    'Ürün silindi': 'bg-red-100 text-red-700',
    'Sipariş silindi': 'bg-red-100 text-red-700',
    'Kullanıcı silindi': 'bg-red-100 text-red-700',
    'Kullanıcı güncellendi': 'bg-blue-100 text-blue-700',
    'Kullanıcı pasifleştirildi': 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-earth-500 hover:text-earth-700">&larr; Dashboard</Link>
              <span className="font-serif text-lg font-bold text-earth-800">Aktivite Logları</span>
            </div>
            <span className="text-sm text-earth-400">Toplam: {total}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-earth-400">Henüz log yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${actionColors[log.action] || 'bg-earth-100 text-earth-600'}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-earth-400">{log.targetType}</span>
                    </div>
                    <p className="text-sm text-earth-700">
                      <span className="font-medium">{log.adminEmail}</span>
                      {log.details && (
                        <span className="text-earth-500">
                          {log.details.name && ` — ${log.details.name}`}
                          {log.details.email && ` (${log.details.email})`}
                          {log.details.orderNumber && ` — #${log.details.orderNumber}`}
                          {log.details.count !== undefined && ` — ${log.details.count} adet`}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-earth-400 whitespace-nowrap ml-4">
                    {new Date(log.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 30 && (
          <div className="flex justify-center space-x-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm bg-white border border-earth-200 rounded-sm disabled:opacity-50"
            >
              Önceki
            </button>
            <span className="px-3 py-1 text-sm text-earth-500">Sayfa {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={logs.length < 30}
              className="px-3 py-1 text-sm bg-white border border-earth-200 rounded-sm disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
