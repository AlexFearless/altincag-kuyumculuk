'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        if (data.announcement) {
          setAnnouncement(data.announcement);
          setTimeout(() => setVisible(true), 300);
          setTimeout(() => {
            setClosing(true);
            setTimeout(() => { setVisible(false); setClosing(false); setAnnouncement(null); }, 700);
          }, 10000);
        }
      } catch { }
    }
    fetchAnnouncement();
  }, []);

  if (!announcement || !visible) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ease-in-out ${
        closing ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
      style={{ maxWidth: '420px', width: 'calc(100% - 32px)' }}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <svg className="w-4 h-4 animate-bounce-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-wide truncate">{announcement.title}</p>
            {announcement.message && (
              <p className="text-xs opacity-80 mt-0.5 truncate">{announcement.message}</p>
            )}
          </div>
          <button
            onClick={() => { setClosing(true); setTimeout(() => { setVisible(false); setClosing(false); setAnnouncement(null); }, 700); }}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
            style={{ color: announcement.text_color }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-0.5 bg-white/20">
          <div className="h-full bg-white/50 animate-progress" style={{ animationDuration: '10s' }} />
        </div>
      </div>
    </div>
  );
}
