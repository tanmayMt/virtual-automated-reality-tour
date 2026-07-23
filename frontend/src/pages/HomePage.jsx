import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import PropertyCard from '../components/PropertyCard.jsx';
import { PropertyGridSkeleton } from '../components/PropertyCardSkeleton.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ListingFilters from '../components/ListingFilters.jsx';
import ListingsMap from '../components/ListingsMap.jsx';
import ThemeToggle, { PublicNav } from '../components/ThemeToggle.jsx';
import { getStoredUser } from '../utils/authStorage.js';

const EMPTY_FILTERS = {
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  propertyType: '',
  sort: 'newest',
};

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState('grid');
  const user = getStoredUser();

  const loadListings = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const params = { sort: filters.sort || 'newest' };
      if (appliedQ.trim()) {
        params.q = appliedQ.trim();
      }
      if (filters.minPrice !== '') {
        params.minPrice = filters.minPrice;
      }
      if (filters.maxPrice !== '') {
        params.maxPrice = filters.maxPrice;
      }
      if (filters.bedrooms !== '') {
        params.bedrooms = filters.bedrooms;
      }
      if (filters.bathrooms !== '') {
        params.bathrooms = filters.bathrooms;
      }
      if (filters.propertyType) {
        params.propertyType = filters.propertyType;
      }
      const { data } = await api.get('/listings', { params });
      setListings(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load listings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [appliedQ, filters]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Virtual property tours
          </h1>
          {user ? (
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                to={user.role === 'buyer' ? '/buyer-dashboard' : '/seller/dashboard'}
                className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <ThemeToggle />
            </nav>
          ) : (
            <PublicNav />
          )}
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={(value) => {
              setQ(value);
              setAppliedQ(value);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                view === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView('map')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                view === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              Map
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Browse listings
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Search, filter, and open 360° virtual tours.
          </p>
        </div>

        <div className="mb-6">
          <ListingFilters filters={filters} onChange={setFilters} />
        </div>

        {loading ? (
          <PropertyGridSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadListings}
              className="mt-3 font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-300">No listings match your search.</p>
          </div>
        ) : view === 'map' ? (
          <div className="space-y-6">
            <ListingsMap listings={listings} />
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const id = listing._id || listing.id;
                return (
                  <li key={id}>
                    <PropertyCard listing={listing} />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const id = listing._id || listing.id;
              return (
                <li key={id}>
                  <PropertyCard listing={listing} />
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
