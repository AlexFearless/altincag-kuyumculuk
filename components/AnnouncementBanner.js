'use client';

import { useState, useEffect } from 'react';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        if (data.announcement) {
          setAnnouncement(data.announcement);
          setTimeout(() => setVisible(true), 300);
          setTimeout(() => { setClosing(true); setTimeout(() => { setVisible(false); setClosing(false); setAnnouncement(null); }, 600); }, 4500);
        }
      } catch { }
    }
    fetchAnnouncement();
  }, []);

  if (!announcement || !visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${closing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}
      style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 text-center">
        <p className="text-sm font-medium">
          <span className="font-bold">{announcement.title}</span>
          {announcement.message && <span className="ml-2 opacity-90">{announcement.message}</span>}
        </p>
      </div>
      <button
        onClick={() => { setClosing(true); setTimeout(() => { setVisible(false); setClosing(false); setAnnouncement(null); }, 600); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        style={{ color: announcement.text_color }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
