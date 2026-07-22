'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';


const categories = [
  { key: 'all', label: 'Tümü' },
  { key: 'siparis', label: 'Sipariş' },
  { key: 'urun', label: 'Ürün' },
  { key: 'iade', label: 'İade' },
  { key: 'destek', label: 'Destek' },
  { key: 'diger', label: 'Diğer' },
];

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

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedThread, setSelectedThread] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const messagesEndRef = useRef(null);
  const prevReplyCountRef = useRef(0);
  const selectedThreadIdRef = useRef(null);

  useEffect(() => {
    if (!user) {
      router.push('/giris');
      return;
    }
    fetchMessages();
  }, [user, router]);

  // Her 10 saniyede bir mesajları yenile
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Seçili thread'i de yenile
  useEffect(() => {
    if (!selectedThread || !user) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
        const res = await fetch('/api/user/messages', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        const updated = data.messages?.find(m => m._id === selectedThread._id);
        if (updated) {
          setSelectedThread(updated);
        }
        setMessages(data.messages || []);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedThread, user]);

  useEffect(() => {
    if (!selectedThread) {
      selectedThreadIdRef.current = null;
      return;
    }
    const isNewThread = selectedThreadIdRef.current !== selectedThread._id;
    selectedThreadIdRef.current = selectedThread._id;

    if (isNewThread) return;

    const currentReplyCount = selectedThread.replies?.length || 0;
    if (currentReplyCount > prevReplyCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevReplyCountRef.current = currentReplyCount;
  }, [selectedThread]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
      const res = await fetch('/api/user/messages', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setMessages(data.messages || []);
      // Seçili thread'i de güncelle
      if (selectedThread) {
        const updated = data.messages?.find(m => m._id === selectedThread._id);
        if (updated) setSelectedThread(updated);
      }
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData({ subject: '', message: '' });
      setShowForm(false);
      fetchMessages();
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setReplying(true);
    setReplyError('');
    try {
      const res = await fetch('/api/user/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedThread._id,
          reply: replyText.trim(),
          senderName: user.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yanıt gönderilemedi');
      setReplyText('');
      setSelectedThread(data.message);
      prevReplyCountRef.current = data.message.replies?.length || 0;
      fetchMessages();
    } catch (error) {
      console.error('Yanıt gönderilemedi:', error);
      setReplyError(error.message);
    } finally {
      setReplying(false);
    }
  };

  if (!user) return null;

  const filteredMessages = activeCategory === 'all'
    ? messages
    : messages.filter(m => m.subject === activeCategory);

  const getCategoryCount = (key) => {
    if (key === 'all') return messages.length;
    return messages.filter(m => m.subject === key).length;
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="font-serif text-2xl font-bold text-earth-800">Destek Taleplerim</h1>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSelectedThread(null); }}
            className="bg-gold-500 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gold-600 transition-colors"
          >
            {showForm ? 'Kapat' : '+ Yeni Talep'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-serif text-lg font-semibold text-earth-800 mb-4">Yeni Destek Talebi</h2>
            <form onSubmit={handleNewTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Konu</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Konu seçin</option>
                  <option value="siparis">Sipariş Sorusu</option>
                  <option value="urun">Ürün Bilgisi</option>
                  <option value="iade">İade / Değişim</option>
                  <option value="destek">Teknik Destek</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">Mesajınız</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-field resize-none h-32"
                  placeholder="Mesajınızı yazın..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-gold-500 text-white px-6 py-2 rounded-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sol: Kategori + Liste */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 mb-4">
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); setSelectedThread(null); }}
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

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-earth-400 text-sm">Bu kategoride talep yok.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg._id}
                    onClick={() => { setSelectedThread(msg); setShowForm(false); prevReplyCountRef.current = msg.replies?.length || 0; }}
                    className={`w-full text-left bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border-2 ${
                      selectedThread?._id === msg._id
                        ? 'border-gold-500'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-earth-600 bg-earth-100 px-2 py-0.5 rounded">
                        {subjectLabels[msg.subject] || msg.subject}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[msg.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[msg.status] || 'Açık'}
                      </span>
                    </div>
                    <p className="text-sm text-earth-800 font-medium line-clamp-1 mb-1">{msg.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-earth-400">
                        {new Date(msg.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </span>
                      {msg.replies && msg.replies.length > 0 && (
                        <span className="text-xs text-gold-600 font-medium">
                          {msg.replies.length} yanıt
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: Seçili talep detayı */}
          <div className="flex-1 min-w-0">
            {selectedThread ? (
              <div className="bg-white rounded-lg shadow-sm flex flex-col" style={{ maxHeight: '70vh' }}>
                <div className="p-4 border-b border-earth-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-earth-600 bg-earth-100 px-2 py-1 rounded">
                      {subjectLabels[selectedThread.subject] || selectedThread.subject}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedThread.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[selectedThread.status] || 'Açık'}
                    </span>
                  </div>
                  <p className="text-xs text-earth-400">
                    {new Date(selectedThread.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* İlk mesaj */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-earth-300 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{user.name?.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-medium text-earth-600">{user.name}</span>
                        <span className="text-xs text-earth-400">
                          {new Date(selectedThread.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-earth-50 rounded-lg rounded-tl-none p-3">
                        <p className="text-sm text-earth-700 whitespace-pre-wrap">{selectedThread.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Yanıtlar */}
                  {selectedThread.replies && selectedThread.replies.map((reply, idx) => (
                    <div key={idx} className={`flex ${reply.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[80%]">
                        <div className={`flex items-center space-x-2 mb-1 ${reply.sender === 'user' ? 'justify-end' : ''}`}>
                          {reply.sender === 'admin' && (
                            <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">A</span>
                            </div>
                          )}
                          <span className="text-xs font-medium text-earth-600">
                            {reply.sender === 'admin' ? 'AltınÇağ Kuyumculuk' : user.name}
                          </span>
                          <span className="text-xs text-earth-400">
                            {new Date(reply.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {reply.sender === 'user' && (
                            <div className="w-6 h-6 bg-earth-300 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{user.name?.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          reply.sender === 'admin'
                            ? 'bg-gold-50 rounded-tl-none'
                            : 'bg-blue-50 rounded-tr-none'
                        }`}>
                          <p className="text-sm text-earth-700 whitespace-pre-wrap">{reply.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedThread.status !== 'closed' ? (
                  <div className="p-4 border-t border-earth-100">
                    {replyError && (
                      <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-2">{replyError}</div>
                    )}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                        placeholder="Yanıtınızı yazın..."
                        className="flex-1 px-4 py-2 border border-earth-200 rounded-sm text-sm focus:outline-none focus:border-gold-500"
                        disabled={replying}
                      />
                      <button
                        onClick={handleReply}
                        disabled={replying || !replyText.trim()}
                        className="bg-gold-500 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-50"
                      >
                        {replying ? '...' : 'Gönder'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-earth-100 bg-green-50 text-center">
                    <p className="text-sm text-green-700">Bu talep kapatılmıştır.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4 opacity-30" />
                <p className="text-earth-400">Bir talep seçerek detayları görüntüleyin</p>
                <p className="text-sm text-earth-300 mt-1">Soldaki listeden bir talep seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
