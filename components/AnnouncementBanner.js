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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-in-out ${closing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}
      style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
    >
      <div className="animate-pulse-subtle">
        <div className="max-w-7xl mx-auto px-6 py-5 text-center relative">
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0 animate-bounce-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.52-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
            <div>
              <p className="text-lg sm:text-xl font-bold tracking-wide">{announcement.title}</p>
              {announcement.message && <p className="text-sm sm:text-base opacity-90 mt-1">{announcement.message}</p>}
            </div>
            <svg className="w-6 h-6 flex-shrink-0 animate-bounce-slow" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.52-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-white/60 animate-progress" style={{ animationDuration: '10s' }} />
          </div>
        </div>
      </div>
      <button
        onClick={() => { setClosing(true); setTimeout(() => { setVisible(false); setClosing(false); setAnnouncement(null); }, 700); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity p-1"
        style={{ color: announcement.text_color }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
