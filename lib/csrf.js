'use client';

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : '';
}

export function csrfHeaders() {
  return { 'X-CSRF-Token': getCsrfToken() };
}

export function csrfFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    ...csrfHeaders(),
  };
  return fetch(url, { ...options, headers, credentials: 'include' });
}
