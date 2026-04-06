import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import PropertyCard from '../components/PropertyCard.jsx';

function Spinner() {
  return (
    <span
      className="inline-block h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      aria-hidden
    />
  );
}

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadListings = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/listings');
      setListings(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not load listings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Virtual property tours</h1>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Seller login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Browse listings</h2>
          <p className="mt-2 text-slate-600">Select a property to open its 360° virtual tour.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
            <Spinner />
            <p className="text-sm text-slate-500">Loading listings…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadListings}
              className="mt-3 font-medium text-red-900 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-slate-600">No listings yet. Check back soon.</p>
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
