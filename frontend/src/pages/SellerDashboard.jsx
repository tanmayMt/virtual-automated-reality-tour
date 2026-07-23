import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { getStoredUser } from '../utils/authStorage.js';

function Spinner() {
  return (
    <span
      className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      aria-hidden
    />
  );
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isStaff = user?.role === 'admin' || user?.role === 'manager';
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
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {isStaff ? 'Staff dashboard' : 'Seller dashboard'}
          </h1>
          <p className="mt-1 text-slate-600">
            {isStaff
              ? 'Edit any tour: rooms, photos, switcher order, and hotspots.'
              : 'Manage your property tours, 360° rooms, and interactive hotspots.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/seller/create')}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create new tour
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
          <Spinner />
          <p className="text-sm text-slate-500">Loading listings…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}{' '}
          <button type="button" onClick={loadListings} className="font-medium text-red-900 underline">
            Retry
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-slate-600">You don&apos;t have any listings yet.</p>
          <button
            type="button"
            onClick={() => navigate('/seller/create')}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your first tour →
          </button>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => {
            const id = listing._id || listing.id;
            const roomCount = Array.isArray(listing.rooms) ? listing.rooms.length : 0;
            const sellerName =
              listing.sellerId && typeof listing.sellerId === 'object'
                ? listing.sellerId.name
                : null;
            return (
              <li
                key={id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/80 px-5 py-4">
                  <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">{listing.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{listing.address}</p>
                  {isStaff && sellerName ? (
                    <p className="mt-1 text-xs text-slate-500">Seller: {sellerName}</p>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col px-5 py-4">
                  <p className="text-2xl font-semibold text-slate-900">
                    {typeof listing.price === 'number'
                      ? `$${listing.price.toLocaleString()}`
                      : listing.price}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {roomCount} room{roomCount === 1 ? '' : 's'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/seller/listing/${id}/edit`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit details
                    </Link>
                    <Link
                      to={`/seller/listing/${id}/rooms`}
                      className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Rooms &amp; hotspots
                    </Link>
                    <Link
                      to={`/tour/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Preview tour
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete “${listing.title}”? This removes rooms and hotspots.`)) {
                          return;
                        }
                        try {
                          await api.delete(`/listings/${id}`);
                          await loadListings();
                        } catch (err) {
                          window.alert(err.response?.data?.message || err.message || 'Delete failed');
                        }
                      }}
                      className="inline-flex w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete listing
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
