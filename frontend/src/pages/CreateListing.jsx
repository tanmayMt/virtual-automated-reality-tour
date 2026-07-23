import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const PROPERTY_TYPES = [
  'apartment',
  'house',
  'condo',
  'townhouse',
  'land',
  'commercial',
  'other',
];

const EMPTY_NEARBY = { name: '', type: 'school', distanceKm: '' };

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    address: '',
    price: '',
    bedrooms: '2',
    bathrooms: '1',
    areaSqft: '',
    propertyType: 'apartment',
    lat: '',
    lng: '',
    tourDurationMinutes: '8',
    nextViewingAt: '',
  });
  const [nearby, setNearby] = useState([{ ...EMPTY_NEARBY }]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const nearbyPlaces = nearby
        .filter((n) => n.name.trim())
        .map((n) => ({
          name: n.name.trim(),
          type: n.type,
          distanceKm: n.distanceKm === '' ? null : Number(n.distanceKm),
        }));

      const { data } = await api.post('/listings', {
        title: form.title.trim(),
        address: form.address.trim(),
        price: Number(form.price),
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        areaSqft: Number(form.areaSqft) || 0,
        propertyType: form.propertyType,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
        tourDurationMinutes: Number(form.tourDurationMinutes) || 5,
        nextViewingAt: form.nextViewingAt || null,
        nearbyPlaces,
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

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100';

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/seller/dashboard" className="text-sm font-medium text-blue-600 transition hover:text-blue-700">
        ← Back to dashboard
      </Link>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step 1 of 3</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Property details</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Add listing info, map coordinates, and nearby places. Next you&apos;ll upload 360° rooms.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="cl-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              id="cl-title"
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cl-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Address
            </label>
            <input
              id="cl-address"
              type="text"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              required
              disabled={loading}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cl-price" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Price (USD)
              </label>
              <input
                id="cl-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                required
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cl-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Property type
              </label>
              <select
                id="cl-type"
                value={form.propertyType}
                onChange={(e) => setField('propertyType', e.target.value)}
                disabled={loading}
                className={inputClass}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="cl-beds" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Beds
              </label>
              <input
                id="cl-beds"
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setField('bedrooms', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cl-baths" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Baths
              </label>
              <input
                id="cl-baths"
                type="number"
                min={0}
                step="0.5"
                value={form.bathrooms}
                onChange={(e) => setField('bathrooms', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cl-area" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Area (sqft)
              </label>
              <input
                id="cl-area"
                type="number"
                min={0}
                value={form.areaSqft}
                onChange={(e) => setField('areaSqft', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cl-lat" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Latitude
              </label>
              <input
                id="cl-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setField('lat', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cl-lng" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Longitude
              </label>
              <input
                id="cl-lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setField('lng', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cl-duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tour duration (min)
              </label>
              <input
                id="cl-duration"
                type="number"
                min={1}
                value={form.tourDurationMinutes}
                onChange={(e) => setField('tourDurationMinutes', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cl-viewing" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Next viewing
              </label>
              <input
                id="cl-viewing"
                type="datetime-local"
                value={form.nextViewingAt}
                onChange={(e) => setField('nextViewingAt', e.target.value)}
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Nearby (schools, hospitals, transport)
            </legend>
            {nearby.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={row.name}
                  onChange={(e) => {
                    const next = [...nearby];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setNearby(next);
                  }}
                  className={inputClass}
                />
                <select
                  value={row.type}
                  onChange={(e) => {
                    const next = [...nearby];
                    next[idx] = { ...next[idx], type: e.target.value };
                    setNearby(next);
                  }}
                  className={inputClass}
                >
                  <option value="school">School</option>
                  <option value="hospital">Hospital</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="Distance km"
                  value={row.distanceKm}
                  onChange={(e) => {
                    const next = [...nearby];
                    next[idx] = { ...next[idx], distanceKm: e.target.value };
                    setNearby(next);
                  }}
                  className={inputClass}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNearby((n) => [...n, { ...EMPTY_NEARBY }])}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add place
            </button>
          </fieldset>

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
