'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const searchProducts = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        const data = await res.json();
        setResults(data.products || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Arama hatası:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchProducts(query);
  }, [query, searchProducts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/arama?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Site içi ürün arama"
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-200 rounded-full
                     text-sm text-earth-700 placeholder-earth-400
                     focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500
                     transition-all duration-200"
        />
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-earth-100 overflow-hidden z-50">
          <div className="max-h-96 overflow-y-auto">
            {results.map((product) => (
              <Link
                key={product._id}
                href={`/urun/${product.slug}`}
                onClick={handleResultClick}
                className="flex items-center px-4 py-3 hover:bg-earth-50 transition-colors border-b border-earth-50 last:border-0"
              >
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-sm mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 bg-earth-100 rounded-sm mr-3 flex items-center justify-center">
                    <span className="text-earth-400 text-xs">Yok</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-earth-800 truncate">{product.name}</p>
                  <div className="flex items-center space-x-2">
                    {product.discountedPrice > 0 ? (
                      <>
                        <span className="text-sm font-semibold text-gold-600">
                          {product.discountedPrice.toLocaleString('tr-TR')} TL
                        </span>
                        <span className="text-xs text-earth-400 line-through">
                          {product.price.toLocaleString('tr-TR')} TL
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-earth-700">
                        {product.price.toLocaleString('tr-TR')} TL
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-4 py-2 bg-earth-50 border-t border-earth-100">
            <button
              onClick={handleSearch}
              className="text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              &quot;{query}&quot; için tüm sonuçları gör
            </button>
          </div>
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-earth-100 p-4 text-center z-50">
          <p className="text-sm text-earth-500">Sonuç bulunamadı</p>
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}
