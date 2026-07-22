'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name || 'Ziyaretçi',
          email: user?.email || '',
          phone: user?.phone || '',
          subject: formData.subject,
          message: formData.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ subject: '', message: '' });
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-earth-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-earth-800">
            İletişim
          </h1>
          <p className="text-earth-500 mt-2">
            Sorularınız için bize ulaşın
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6">
                Bize Ulaşın
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gold-50 rounded-lg">
                    <MapPinIcon className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-earth-800">Adres</h3>
                    <p className="text-earth-500 text-sm mt-1">
                      Çağlayan, Vatan Cd. No:55/C<br />
                      34403 Kağıthane/İstanbul
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gold-50 rounded-lg">
                    <PhoneIcon className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-earth-800">Telefon</h3>
                    <p className="text-earth-500 text-sm mt-1">
                      (0212) 232 22 12
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gold-50 rounded-lg">
                    <MailIcon className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-earth-800">E-posta</h3>
                    <p className="text-earth-500 text-sm mt-1">
                      info@altincagkuyumculuk.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gold-50 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-earth-800">Çalışma Saatleri</h3>
                    <p className="text-earth-500 text-sm mt-1">
                      Pazartesi - Cumartesi: 09:00 - 20:00<br />
                      Pazar: Kapalı
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-4">
                Konumumuz
              </h3>
              <div className="aspect-video bg-earth-100 rounded-lg overflow-hidden relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3010.5!2d28.97!3d41.05!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zQ2HDp2dsYXlhbiwgVmF0YW4gQ2QuIE5vOjU1L0MsIEvEn2TDp2hhbmUv0IanysOR!5e0!3m2!1str!2str!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(30%) sepia(10%)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
                <a
                  href="https://www.google.com/maps/search/Çağlayan+Vatan+Cd+No+55/C+Kağıthane+İstanbul"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 bg-gold-500 text-white px-4 py-2 rounded-sm text-sm font-medium
                             hover:bg-gold-600 transition-colors shadow-lg"
                >
                  Yol Tarifi Al
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 lg:p-8">
            <h2 className="font-serif text-2xl font-bold text-earth-800 mb-2">
              Destek Talebi Oluşturun
            </h2>

            {user ? (
              <div className="bg-earth-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-earth-500">
                  <span className="font-medium text-earth-700">{user.name}</span> olarak gönderilecek
                </p>
                <p className="text-xs text-earth-400 mt-1">{user.email} • {user.phone || 'Telefon belirtilmemiş'}</p>
              </div>
            ) : (
              <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-earth-700 mb-2">
                  Destek talebi oluşturmak için giriş yapmalısınız.
                </p>
                <Link
                  href="/giris"
                  className="inline-block bg-gold-500 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gold-600 transition-colors"
                >
                  Giriş Yap
                </Link>
              </div>
            )}

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-serif text-xl text-earth-800 mb-2">
                  Talebiniz Oluşturuldu!
                </h3>
                <p className="text-earth-500">
                  En kısa sürede size dönüş yapacağız.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Konu
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value="siparis">Sipariş Sorusu</option>
                    <option value="urun">Ürün Bilgisi</option>
                    <option value="iade">İade / Değişim</option>
                    <option value="destek">Teknik Destek</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1">
                    Mesajınız
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-field resize-none h-32"
                    placeholder="Mesajınızı yazın..."
                    required
                  />
                </div>

                {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-sm">{error}</div>}
                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="w-full bg-gold-500 text-white py-3 rounded-sm font-medium
                             hover:bg-gold-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Gönderiliyor...' : 'Destek Talebi Gönder'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function PhoneIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
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

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
