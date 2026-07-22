'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const selectedMessageIdRef = useRef(null);
  const prevAdminReplyCountRef = useRef(0);

  const getToken = () => localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');

  const authFetch = async (url, options = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchMessages();
  }, [router]);

  // Her 8 saniyede bir yenile
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(), 8000);
    return () => clearInterval(interval);
  }, []);

  // Seçili mesajı da yenile
  useEffect(() => {
    if (!selectedMessage) return;
    const interval = setInterval(async () => {
      try {
        const res = await authFetch('/api/messages');
        const data = await res.json();
        const updated = data.messages?.find(m => m._id === selectedMessage._id);
        if (updated) setSelectedMessage(updated);
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedMessage]);

  useEffect(() => {
    if (!selectedMessage) {
      selectedMessageIdRef.current = null;
      return;
    }
    const isNewMessage = selectedMessageIdRef.current !== selectedMessage._id;
    selectedMessageIdRef.current = selectedMessage._id;

    if (isNewMessage) return;

    const currentReplyCount = selectedMessage.replies?.length || 0;
    if (currentReplyCount > prevAdminReplyCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevAdminReplyCountRef.current = currentReplyCount;
  }, [selectedMessage]);

  const fetchMessages = async () => {
    try {
      const res = await authFetch('/api/messages');
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
        if (selectedMessage) {
          const updated = data.messages?.find(m => m._id === selectedMessage._id);
          if (updated) setSelectedMessage(updated);
        }
      }
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await authFetch('/api/messages', {
        method: 'PUT',
        body: JSON.stringify({ id, isRead: true }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Okundu işareti hatası:', error);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    setReplyError('');
    try {
      const res = await authFetch('/api/messages', {
        method: 'PUT',
        body: JSON.stringify({
          id: selectedMessage._id,
          reply: replyText.trim(),
          senderName: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yanıt gönderilemedi');
      setSelectedMessage(data.message);
      setReplyText('');
      fetchMessages();
    } catch (error) {
      console.error('Yanıt gönderilemedi:', error);
      setReplyError(error.message);
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
      await authFetch(`/api/messages?id=${id}`, { method: 'DELETE' });
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Mesaj silinemedi:', error);
    }
  };

  const handleCloseThread = async () => {
    if (!selectedMessage) return;
    try {
      await authFetch('/api/messages', {
        method: 'PUT',
        body: JSON.stringify({ id: selectedMessage._id, status: 'closed' }),
      });
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error('Kapatma hatası:', error);
    }
  };

  const subjectLabels = {
    siparis: 'Sipariş Sorusu',
    urun: 'Ürün Bilgisi',
    iade: 'İade / Değişim',
    destek: 'Teknik Destek',
    diger: 'Diğer',
  };

  const statusLabels = {
    open: 'Açık',
    answered: 'Yanıtlandı',
    closed: 'Kapandı',
  };

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-700',
    answered: 'bg-blue-100 text-blue-700',
    closed: 'bg-green-100 text-green-700',
  };

  const categories = [
    { key: 'all', label: 'Tümü' },
    { key: 'siparis', label: 'Sipariş' },
    { key: 'urun', label: 'Ürün' },
    { key: 'iade', label: 'İade' },
    { key: 'destek', label: 'Destek' },
    { key: 'diger', label: 'Diğer' },
  ];

  const filteredMessages = activeCategory === 'all'
    ? messages
    : messages.filter(m => m.subject === activeCategory);

  const getCategoryCount = (key) => {
    if (key === 'all') return messages.length;
    return messages.filter(m => m.subject === key).length;
  };

  return (
    <div className="min-h-screen bg-earth-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-earth-500 hover:text-earth-700">&larr; Dashboard</Link>
              <span className="font-serif text-lg font-bold text-earth-800">Mesaj Yönetimi</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} yeni</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Kategori sekmeleri */}
        <div className="bg-white rounded-lg shadow-sm p-2 mb-6">
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setSelectedMessage(null); }}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-gold-500 text-white'
                    : 'text-earth-600 hover:bg-earth-50'
                }`}
              >
                {cat.label}
                <span className="ml-1 opacity-70">({getCategoryCount(cat.key)})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sol: Mesaj listesi */}
          <div className="lg:w-96 flex-shrink-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-earth-400">Bu kategoride mesaj yok.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg._id}
                    onClick={() => { setSelectedMessage(msg); markAsRead(msg._id); prevAdminReplyCountRef.current = msg.replies?.length || 0; }}
                    className={`w-full text-left bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border-2 ${
                      selectedMessage?._id === msg._id
                        ? 'border-gold-500'
                        : 'border-transparent'
                    } ${!msg.isRead ? 'ring-2 ring-gold-200' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-earth-800">{msg.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[msg.status] || 'bg-yellow-100 text-yellow-700'}`}>
                        {statusLabels[msg.status] || 'Açık'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-earth-500 bg-earth-100 px-2 py-0.5 rounded">
                        {subjectLabels[msg.subject] || msg.subject}
                      </span>
                      <span className="text-xs text-earth-400">
                        {new Date(msg.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-earth-500 line-clamp-1">{msg.message}</p>
                    {msg.replies && msg.replies.length > 0 && (
                      <p className="text-xs text-gold-600 font-medium mt-1">{msg.replies.length} yanıt</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Mesaj detayı */}
          <div className="flex-1 min-w-0">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow-sm flex flex-col" style={{ maxHeight: '75vh' }}>
                <div className="p-4 border-b border-earth-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-earth-800">{selectedMessage.name}</h2>
                      <p className="text-xs text-earth-400">{selectedMessage.email} | {selectedMessage.phone || 'Telefon yok'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedMessage.status] || 'bg-yellow-100 text-yellow-700'}`}>
                        {statusLabels[selectedMessage.status] || 'Açık'}
                      </span>
                      <button
                        onClick={() => deleteMessage(selectedMessage._id)}
                        className="text-red-400 hover:text-red-600 text-sm px-2 py-1"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-earth-400">
                    {new Date(selectedMessage.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* İlk mesaj */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-earth-300 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{selectedMessage.name?.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-medium text-earth-600">{selectedMessage.name}</span>
                        <span className="text-xs text-earth-400">
                          {new Date(selectedMessage.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-earth-50 rounded-lg rounded-tl-none p-3">
                        <p className="text-xs text-gold-600 font-medium mb-1">
                          Konu: {subjectLabels[selectedMessage.subject] || selectedMessage.subject}
                        </p>
                        <p className="text-sm text-earth-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Yanıtlar */}
                  {selectedMessage.replies && selectedMessage.replies.map((reply, idx) => (
                    <div key={idx} className={`flex ${reply.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                        <div className={`flex items-center space-x-2 mb-1 ${reply.sender === 'admin' ? 'justify-end' : ''}`}>
                          {reply.sender === 'admin' && (
                            <>
                              <span className="text-xs text-earth-400">
                                {new Date(reply.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-xs font-medium text-gold-700">Admin</span>
                              <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                            </>
                          )}
                          {reply.sender === 'user' && (
                            <>
                              <div className="w-6 h-6 bg-earth-300 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{selectedMessage.name?.charAt(0)}</span>
                              </div>
                              <span className="text-xs font-medium text-earth-600">{reply.senderName || selectedMessage.name}</span>
                              <span className="text-xs text-earth-400">
                                {new Date(reply.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          reply.sender === 'admin'
                            ? 'bg-gold-50 rounded-tr-none'
                            : 'bg-earth-50 rounded-tl-none'
                        }`}>
                          <p className="text-sm text-earth-700 whitespace-pre-wrap">{reply.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedMessage.status !== 'closed' ? (
                  <div className="p-4 border-t border-earth-100">
                    {replyError && (
                      <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-2">{replyError}</div>
                    )}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendReply(); } }}
                        placeholder="Yanıtınızı yazın..."
                        className="flex-1 px-4 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
                      />
                      <button
                        onClick={sendReply}
                        disabled={!replyText.trim()}
                        className="bg-gold-500 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
                      >
                        Yanıt Gönder
                      </button>
                      <button
                        onClick={handleCloseThread}
                        className="bg-earth-200 text-earth-600 px-4 py-2 rounded-sm text-sm font-medium hover:bg-earth-300 transition-colors"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-earth-100 bg-green-50 text-center">
                    <p className="text-sm text-green-700">Bu talep kapatılmıştır.</p>
                    <button
                      onClick={async () => {
                        await authFetch('/api/messages', {
                          method: 'PUT',
                          body: JSON.stringify({ id: selectedMessage._id, status: 'open' }),
                        });
                        fetchMessages();
                        setSelectedMessage(null);
                      }}
                      className="text-xs text-gold-600 hover:text-gold-700 mt-1 underline"
                    >
                      Yeniden Aç
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-earth-400">Bir mesaj seçerek detayları görüntüleyin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
