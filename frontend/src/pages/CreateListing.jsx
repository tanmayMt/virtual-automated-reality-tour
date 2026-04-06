import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

export default function CreateListing() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/listings', {
        title: title.trim(),
        address: address.trim(),
        price: Number(price),
      });
      const listing = data?.data;
      const listingId = listing?._id || listing?.id;
      if (!listingId) {
        window.alert('Listing created but no id was returned.');
        return;
      }
      navigate(`/seller/listing/${listingId}/rooms`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not create listing';
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        to="/seller/dashboard"
        className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step 1 of 3</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Property details</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the basics. Next you&apos;ll upload 360° room images and place hotspots.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="cl-title" className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="cl-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Modern loft downtown"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="cl-address" className="block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              id="cl-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="cl-price" className="block text-sm font-medium text-slate-700">
              Price (USD)
            </label>
            <input
              id="cl-price"
              type="number"
              min={0}
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Continue to rooms'}
          </button>
        </form>
      </div>
    </div>
  );
}
