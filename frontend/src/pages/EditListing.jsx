import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

function toDatetimeLocal(value) {
  if (!value) {
    return '';
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Edit listing details created by seller (or any listing for admin/manager).
 */
export default function EditListing() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    address: '',
    price: '',
    bedrooms: '0',
    bathrooms: '0',
    areaSqft: '',
    propertyType: 'apartment',
    lat: '',
    lng: '',
    tourDurationMinutes: '5',
    nextViewingAt: '',
  });
  const [nearby, setNearby] = useState([{ ...EMPTY_NEARBY }]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/listings/${listingId}`);
        const listing = data?.data;
        if (!listing) {
          throw new Error('Listing not found');
        }
        if (cancelled) {
          return;
        }
        setForm({
          title: listing.title || '',
          address: listing.address || '',
          price: listing.price != null ? String(listing.price) : '',
          bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : '0',
          bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : '0',
          areaSqft: listing.areaSqft != null ? String(listing.areaSqft) : '',
          propertyType: listing.propertyType || 'apartment',
          lat: listing.lat != null ? String(listing.lat) : '',
          lng: listing.lng != null ? String(listing.lng) : '',
          tourDurationMinutes:
            listing.tourDurationMinutes != null ? String(listing.tourDurationMinutes) : '5',
          nextViewingAt: toDatetimeLocal(listing.nextViewingAt),
        });
        const places = Array.isArray(listing.nearbyPlaces) ? listing.nearbyPlaces : [];
        setNearby(
          places.length
            ? places.map((p) => ({
                name: p.name || '',
                type: p.type || 'other',
                distanceKm: p.distanceKm != null ? String(p.distanceKm) : '',
              }))
            : [{ ...EMPTY_NEARBY }]
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Could not load listing');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const nearbyPlaces = nearby
        .filter((n) => n.name.trim())
        .map((n) => ({
          name: n.name.trim(),
          type: n.type,
          distanceKm: n.distanceKm === '' ? null : Number(n.distanceKm),
        }));

      await api.patch(`/listings/${listingId}`, {
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
      navigate(`/seller/listing/${listingId}/rooms`);
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || 'Could not save listing');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2 disabled:opacity-60';

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-slate-500">Loading listing…</div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/seller/dashboard" className="text-sm font-medium text-blue-600">
          ← Dashboard
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/seller/dashboard" className="text-sm font-medium text-blue-600 transition hover:text-blue-700">
        ← Back to dashboard
      </Link>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Edit property details</h1>
        <p className="mt-1 text-sm text-slate-600">
          Update title, price, location, and nearby places. Rooms and hotspots are edited separately.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="el-title" className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="el-title"
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              required
              disabled={saving}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="el-address" className="block text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              id="el-address"
              type="text"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              required
              disabled={saving}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="el-price" className="block text-sm font-medium text-slate-700">
                Price (USD)
              </label>
              <input
                id="el-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                required
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="el-type" className="block text-sm font-medium text-slate-700">
                Property type
              </label>
              <select
                id="el-type"
                value={form.propertyType}
                onChange={(e) => setField('propertyType', e.target.value)}
                disabled={saving}
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
              <label htmlFor="el-beds" className="block text-sm font-medium text-slate-700">
                Beds
              </label>
              <input
                id="el-beds"
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setField('bedrooms', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="el-baths" className="block text-sm font-medium text-slate-700">
                Baths
              </label>
              <input
                id="el-baths"
                type="number"
                min={0}
                step="0.5"
                value={form.bathrooms}
                onChange={(e) => setField('bathrooms', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="el-area" className="block text-sm font-medium text-slate-700">
                Area (sqft)
              </label>
              <input
                id="el-area"
                type="number"
                min={0}
                value={form.areaSqft}
                onChange={(e) => setField('areaSqft', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="el-lat" className="block text-sm font-medium text-slate-700">
                Latitude
              </label>
              <input
                id="el-lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setField('lat', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="el-lng" className="block text-sm font-medium text-slate-700">
                Longitude
              </label>
              <input
                id="el-lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setField('lng', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="el-duration" className="block text-sm font-medium text-slate-700">
                Tour duration (min)
              </label>
              <input
                id="el-duration"
                type="number"
                min={1}
                value={form.tourDurationMinutes}
                onChange={(e) => setField('tourDurationMinutes', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="el-viewing" className="block text-sm font-medium text-slate-700">
                Next viewing
              </label>
              <input
                id="el-viewing"
                type="datetime-local"
                value={form.nextViewingAt}
                onChange={(e) => setField('nextViewingAt', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-medium text-slate-700">
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

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save details'}
            </button>
            <Link
              to={`/seller/listing/${listingId}/rooms`}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage rooms
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
