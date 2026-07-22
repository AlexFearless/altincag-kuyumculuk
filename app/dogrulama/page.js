'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function DogrulamaContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const emailFailed = searchParams.get('emailFailed') === '1';
  const emailErr = searchParams.get('emailErr') || '';
  const router = useRouter();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      router.push('/kayit');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [email, router]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(c => c !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      const nextEmpty = newCode.findIndex(c => c === '');
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

      if (pasted.length === 6) {
        handleVerify(pasted);
      }
    }
  };

  const handleVerify = async (codeStr) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      setSuccess(true);

      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError('Doğrulama sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setResendTimer(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Kod gönderilemedi');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-earth-800 via-earth-700 to-earth-900 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white mb-2">Doğrulama Başarılı!</h1>
            <p className="text-earth-300 text-sm">Hesabınız aktif hale getirildi. Yönlendiriliyorsunuz...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-800 via-earth-700 to-earth-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500/20 rounded-full mb-4 backdrop-blur-sm">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">E-posta Doğrulama</h1>
          <p className="text-earth-300 text-sm">
            <span className="text-gold-400">{email}</span> adresine 6 haneli kod gönderdik
          </p>
          <div className="mt-4 bg-yellow-500/15 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-start space-x-2.5">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-yellow-200 text-xs leading-relaxed">
              E-posta gelen kutunuza düşmediyse <strong>spam / gereksiz / Junk</strong> klasörünü mutlaka kontrol edin.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
          {emailFailed && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 text-sm p-3 rounded-xl mb-6 flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-xl mb-6 flex items-center space-x-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-8">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center space-x-2 mb-4 text-gold-400">
              <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Doğrulanıyor...</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-earth-400 text-sm mb-3">Kod gelmedi mi?</p>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || resendLoading}
              className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                'Gönderiliyor...'
              ) : resendTimer > 0 ? (
                <span>Yeniden gönder ({resendTimer}s)</span>
              ) : (
                'Yeni kod gönder'
              )}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/giris" className="text-earth-400 hover:text-earth-200 text-sm transition-colors">
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DogrulamaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-earth-800 via-earth-700 to-earth-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DogrulamaContent />
    </Suspense>
  );
}
