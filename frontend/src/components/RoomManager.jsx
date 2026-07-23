import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { getStoredUser } from '../utils/authStorage.js';

function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 ${className}`}
      aria-hidden
    />
  );
}

/**
 * Step 2: manage rooms — add, rename, replace photo, reorder (switcher order), delete.
 * Sellers edit own listings; admin/manager can edit any.
 */
export default function RoomManager({ listingId: listingIdProp }) {
  const { listingId: listingIdFromRoute } = useParams();
  const listingId = listingIdProp ?? listingIdFromRoute;
  const user = getStoredUser();

  const [listing, setListing] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [roomName, setRoomName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyRoomId, setBusyRoomId] = useState('');

  const loadListing = useCallback(async () => {
    if (!listingId) {
      setLoadError('Missing listing id');
      return;
    }
    setLoadError('');
    try {
      const { data } = await api.get(`/listings/${listingId}`);
      setListing(data?.data || null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load listing';
      setLoadError(msg);
      window.alert(msg);
    }
  }, [listingId]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  async function handleAddRoom(e) {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    if (!listingId) {
      window.alert('Missing listing id');
      return;
    }
    if (!file) {
      setFormError('Choose a 360° equirectangular image.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await api.post('/rooms/upload', formData);
      const imageUrl =
        uploadRes.data?.data?.url ||
        uploadRes.data?.data?.imageUrl ||
        uploadRes.data?.data?.secure_url;

      if (!imageUrl) {
        const msg = 'Upload succeeded but no image URL was returned.';
        setFormError(msg);
        window.alert(msg);
        return;
      }

      setUploading(false);
      setCreating(true);

      await api.post('/rooms', {
        name: roomName.trim(),
        listingId,
        imageUrl,
      });

      setSuccess(`Room “${roomName.trim()}” created.`);
      setRoomName('');
      setFile(null);
      await loadListing();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload or create failed';
      setFormError(msg);
      window.alert(msg);
    } finally {
      setUploading(false);
      setCreating(false);
    }
  }

  async function renameRoom(room) {
    const next = window.prompt('Room name', room.name || '');
    if (next == null) {
      return;
    }
    const name = next.trim();
    if (!name) {
      window.alert('Name cannot be empty.');
      return;
    }
    setBusyRoomId(room._id);
    try {
      await api.patch(`/rooms/${room._id}`, { name });
      await loadListing();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || 'Rename failed');
    } finally {
      setBusyRoomId('');
    }
  }

  async function replacePhoto(room, fileObj) {
    if (!fileObj) {
      return;
    }
    setBusyRoomId(room._id);
    try {
      const formData = new FormData();
      formData.append('image', fileObj);
      const uploadRes = await api.post('/rooms/upload', formData);
      const imageUrl =
        uploadRes.data?.data?.url ||
        uploadRes.data?.data?.imageUrl ||
        uploadRes.data?.data?.secure_url;
      if (!imageUrl) {
        throw new Error('No image URL returned');
      }
      await api.patch(`/rooms/${room._id}`, { imageUrl });
      await loadListing();
      setSuccess(`Photo updated for “${room.name}”.`);
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || 'Photo replace failed');
    } finally {
      setBusyRoomId('');
    }
  }

  async function removeRoom(room) {
    if (!window.confirm(`Delete room “${room.name}”? Hotspots in this room will be removed.`)) {
      return;
    }
    setBusyRoomId(room._id);
    try {
      await api.delete(`/rooms/${room._id}`);
      await loadListing();
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setBusyRoomId('');
    }
  }

  async function moveRoom(index, direction) {
    const rooms = listing?.rooms || [];
    const target = index + direction;
    if (target < 0 || target >= rooms.length) {
      return;
    }
    const next = [...rooms];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    const roomIds = next.map((r) => r._id);
    setBusyRoomId(rooms[index]._id);
    try {
      const { data } = await api.put(`/listings/${listingId}/rooms/order`, { roomIds });
      setListing(data?.data || listing);
    } catch (err) {
      window.alert(err.response?.data?.message || err.message || 'Reorder failed');
      await loadListing();
    } finally {
      setBusyRoomId('');
    }
  }

  const busy = uploading || creating;
  const rooms = listing?.rooms || [];
  const roleLabel =
    user?.role === 'admin' || user?.role === 'manager' ? 'Staff editor' : 'Seller editor';

  if (!listingId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Missing listing id.
      </div>
    );
  }

  if (loadError && !listing) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {loadError}
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-500">
        <Spinner />
        <p className="text-sm">Loading listing…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/seller/dashboard"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link
            to={`/seller/listing/${listingId}/edit`}
            className="font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            Edit property details
          </Link>
          <Link
            to={`/tour/${listingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            Preview tour
          </Link>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Step 2 of 3 · {roleLabel}
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">{listing.title}</h1>
        <p className="mt-1 text-slate-600">{listing.address}</p>
        <p className="mt-2 text-sm text-slate-500">
          Room order below is the tour room switcher order (first = start room).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add room</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload an equirectangular 360° panorama, then name the space.
          </p>
          <form onSubmit={handleAddRoom} className="mt-6 space-y-5">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-slate-700">
                Room name
              </label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
                placeholder="Living room"
                disabled={busy}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="panorama" className="block text-sm font-medium text-slate-700">
                360° image
              </label>
              <input
                id="panorama"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1.5 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {formError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
            ) : null}
            {success ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Spinner className="h-5 w-5 border-white/40 border-t-white" />
                  {uploading ? 'Uploading image…' : 'Saving room…'}
                </>
              ) : (
                'Upload & create room'
              )}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Rooms &amp; switcher order</h2>
          <p className="mt-1 text-sm text-slate-600">
            Rename, replace photo, reorder, delete, or edit navigation/feature hotspots.
          </p>
          <ul className="mt-6 space-y-3">
            {rooms.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                No rooms yet. Add your first panorama.
              </li>
            ) : (
              rooms.map((room, index) => {
                const id = room._id;
                const roomBusy = String(busyRoomId) === String(id);
                return (
                  <li
                    key={id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        {room.imageUrl ? (
                          <img
                            src={room.imageUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-500">
                            No img
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {index + 1}. {room.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {room.hotspots?.length || 0} hotspot
                            {(room.hotspots?.length || 0) === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/seller/listing/${listingId}/room/${id}/hotspots`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Edit hotspots
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={roomBusy || index === 0}
                        onClick={() => moveRoom(index, -1)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
                      >
                        ↑ Up
                      </button>
                      <button
                        type="button"
                        disabled={roomBusy || index === rooms.length - 1}
                        onClick={() => moveRoom(index, 1)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
                      >
                        ↓ Down
                      </button>
                      <button
                        type="button"
                        disabled={roomBusy}
                        onClick={() => renameRoom(room)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
                      >
                        Rename
                      </button>
                      <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40">
                        Replace photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={roomBusy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) {
                              replacePhoto(room, f);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={roomBusy}
                        onClick={() => removeRoom(room)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-40"
                      >
                        {roomBusy ? '…' : 'Delete'}
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
