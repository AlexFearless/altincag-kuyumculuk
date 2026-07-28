'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function NonceApplier({ nonce }) {
  useEffect(() => {
    if (!nonce) return;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeName === 'STYLE') {
            node.setAttribute('nonce', nonce);
          }
        }
      }
    });
    observer.observe(document.head, { childList: true, subtree: true });
    document.querySelectorAll('style').forEach(s => s.setAttribute('nonce', nonce));
    return () => observer.disconnect();
  }, [nonce]);

  return (
    <Script
      id="nonce-applier"
      strategy="beforeInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `(${function() {
          function applyNonce() {
            document.querySelectorAll('style').forEach(function(s) {
              var n = document.documentElement.getAttribute('data-nonce');
              if (n && !s.getAttribute('nonce')) s.setAttribute('nonce', n);
            });
          }
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyNonce);
          } else {
            applyNonce();
          }
          new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
              m.addedNodes.forEach(function(node) {
                if (node.nodeName === 'STYLE') {
                  var n = document.documentElement.getAttribute('data-nonce');
                  if (n && !node.getAttribute('nonce')) node.setAttribute('nonce', n);
                }
              });
            });
          }).observe(document.head, { childList: true, subtree: true });
        }})()`,
      }}
    />
  );
}
