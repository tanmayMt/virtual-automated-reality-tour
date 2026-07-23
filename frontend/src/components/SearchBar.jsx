import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

/**
 * Instant search with autocomplete suggestions.
 */
export default function SearchBar({ value, onChange, onSubmit, stickyClassName = '' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const q = String(value || '').trim();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/listings/suggest', { params: { q } });
        const list = Array.isArray(data?.data) ? data.data : [];
        setSuggestions(list);
        setOpen(list.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const hint = useMemo(() => {
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      return suggestions[activeIndex].title;
    }
    return '';
  }, [activeIndex, suggestions]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        onChange(suggestions[activeIndex].title);
        setOpen(false);
        onSubmit?.(suggestions[activeIndex].title);
      } else {
        onSubmit?.(value);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative w-full ${stickyClassName}`}>
      <label htmlFor="listing-search" className="sr-only">
        Search properties
      </label>
      <div className="flex gap-2">
        <input
          id="listing-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="listing-suggest"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `suggest-${activeIndex}` : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by title, address, or type…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={() => {
            onSubmit?.(value);
            setOpen(false);
          }}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Search
        </button>
      </div>
      {hint ? <p className="sr-only">Suggestion: {hint}</p> : null}
      {open ? (
        <ul
          id="listing-suggest"
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {suggestions.map((s, idx) => (
            <li key={s._id} role="option" aria-selected={idx === activeIndex} id={`suggest-${idx}`}>
              <Link
                to={`/property/${s._id}`}
                className={`block px-4 py-2.5 text-sm transition ${
                  idx === activeIndex
                    ? 'bg-blue-50 text-blue-800 dark:bg-slate-800 dark:text-blue-200'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="font-medium">{s.title}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {s.address}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
