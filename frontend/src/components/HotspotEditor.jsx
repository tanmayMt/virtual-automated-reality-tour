import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pannellum } from 'pannellum-react';
import api from '../api/axios.js';
import { getStoredUser } from '../utils/authStorage.js';

function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 ${className}`}
      aria-hidden
    />
  );
}

function formatAngle(n) {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : '—';
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function serializeHotspot(h) {
  return {
    type: h.type,
    yaw: h.yaw,
    pitch: h.pitch,
    text: h.text || '',
    description: h.description || '',
    targetRoomId: h.targetRoomId
      ? typeof h.targetRoomId === 'object'
        ? String(h.targetRoomId._id || h.targetRoomId)
        : String(h.targetRoomId)
      : null,
  };
}

/**
 * Step 3: add / edit / delete navigation & feature hotspots (seller + admin/manager).
 */
export default function HotspotEditor() {
  const { listingId, roomId } = useParams();
  const pannellumRef = useRef(null);
  const user = getStoredUser();

  const [listing, setListing] = useState(null);
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [hotspots, setHotspots] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [pendingAngles, setPendingAngles] = useState(null);
  const [hotspotType, setHotspotType] = useState('navigation');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get(`/listings/${listingId}`);
      const list = data?.data;
      setListing(list || null);

      if (!list || !Array.isArray(list.rooms) || list.rooms.length === 0) {
        setRoom(null);
        setHotspots([]);
        return;
      }

      const current = list.rooms.find((r) => String(r._id) === String(roomId));
      if (!current) {
        setRoom(null);
        setHotspots([]);
        setLoadError('Room not found on this listing.');
        return;
      }

      setRoom(current);
      setHotspots(Array.isArray(current.hotspots) ? [...current.hotspots] : []);
    } catch (err) {
      console.error('HotspotEditor: failed to load listing', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load';
      setLoadError(msg);
      setListing(null);
      setRoom(null);
      setHotspots([]);
    } finally {
      setIsLoading(false);
    }
  }, [listingId, roomId]);

  useEffect(() => {
    load();
  }, [load]);

  const otherRooms = useMemo(
    () => (listing?.rooms || []).filter((r) => String(r._id) !== String(roomId)),
    [listing?.rooms, roomId]
  );

  function openCreateModal(yaw, pitch) {
    setEditIndex(null);
    setPendingAngles({ yaw, pitch });
    setHotspotType('navigation');
    setTargetRoomId('');
    setFeatureDescription('');
    setModalOpen(true);
  }

  function openEditModal(index) {
    const h = hotspots[index];
    if (!h) {
      return;
    }
    setEditIndex(index);
    setPendingAngles({ yaw: Number(h.yaw), pitch: Number(h.pitch) });
    setHotspotType(h.type === 'feature' ? 'feature' : 'navigation');
    const tid = h.targetRoomId
      ? typeof h.targetRoomId === 'object'
        ? String(h.targetRoomId._id || h.targetRoomId)
        : String(h.targetRoomId)
      : '';
    setTargetRoomId(tid);
    setFeatureDescription(h.description || h.text || '');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setPendingAngles(null);
    setEditIndex(null);
  }

  const handlePanoramaMouseUp = useCallback((event) => {
    const inst = pannellumRef.current;
    if (!inst || typeof inst.getViewer !== 'function') {
      return;
    }
    const viewer = inst.getViewer();
    if (!viewer) {
      return;
    }
    let yaw = null;
    let pitch = null;

    if (event && typeof viewer.mouseEventToCoords === 'function') {
      try {
        const coords = viewer.mouseEventToCoords(event);
        if (Array.isArray(coords) && coords.length >= 2) {
          pitch = toFiniteNumber(coords[0]);
          yaw = toFiniteNumber(coords[1]);
        }
      } catch (err) {
        console.error('HotspotEditor: mouseEventToCoords failed', err);
      }
    }

    if ((yaw == null || pitch == null) && typeof viewer.getYaw === 'function' && typeof viewer.getPitch === 'function') {
      yaw = toFiniteNumber(viewer.getYaw());
      pitch = toFiniteNumber(viewer.getPitch());
    }
    if (yaw == null || pitch == null) {
      return;
    }

    openCreateModal(yaw, pitch);
  }, []);

  async function persistHotspots(nextList) {
    const payload = nextList.map(serializeHotspot);
    setSaving(true);
    try {
      const { data } = await api.put(`/rooms/${roomId}/hotspots`, { hotspots: payload });
      const updated = data?.data;
      const next = Array.isArray(updated?.hotspots) ? updated.hotspots : nextList;
      setHotspots(next);
      closeModal();
      await load();
    } catch (err) {
      console.error('HotspotEditor: save hotspots failed', err);
      const msg = err.response?.data?.message || err.message || 'Save failed';
      window.alert(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveHotspot(e) {
    e.preventDefault();
    if (!pendingAngles) {
      window.alert('No position captured. Click the panorama again.');
      return;
    }

    if (hotspotType === 'navigation') {
      if (!targetRoomId) {
        window.alert('Select a target room for navigation.');
        return;
      }
    } else if (!featureDescription.trim()) {
      window.alert('Enter a description for this feature.');
      return;
    }

    const targetRoom = otherRooms.find((r) => String(r._id) === String(targetRoomId));
    let text = '';
    let description = '';
    let navTarget = null;

    if (hotspotType === 'navigation') {
      text = targetRoom ? `Go to ${targetRoom.name}` : 'Navigate';
      navTarget = targetRoomId;
    } else {
      description = featureDescription.trim();
      text = description.length > 72 ? `${description.slice(0, 72)}…` : description;
    }

    const normalizedYaw = Math.round(pendingAngles.yaw * 10000) / 10000;
    const normalizedPitch = Math.round(pendingAngles.pitch * 10000) / 10000;

    const entry = {
      type: hotspotType,
      yaw: normalizedYaw,
      pitch: normalizedPitch,
      text,
      description,
      targetRoomId: hotspotType === 'navigation' ? navTarget : null,
    };

    const next =
      editIndex != null
        ? hotspots.map((h, i) => (i === editIndex ? { ...h, ...entry } : h))
        : [...hotspots, entry];

    await persistHotspots(next);
  }

  async function deleteHotspot(index) {
    if (!window.confirm('Delete this hotspot?')) {
      return;
    }
    const next = hotspots.filter((_, i) => i !== index);
    await persistHotspots(next);
  }

  const imageUrl = room?.imageUrl;
  const roleLabel =
    user?.role === 'admin' || user?.role === 'manager' ? 'Staff editor' : 'Seller editor';

  const hotspotElements = useMemo(() => {
    if (!Array.isArray(hotspots) || hotspots.length === 0) {
      return null;
    }
    return hotspots.map((h, idx) => (
      <Pannellum.Hotspot
        key={h._id || `hs-${idx}-${h.yaw}-${h.pitch}`}
        type="info"
        pitch={h.pitch}
        yaw={h.yaw}
        text={h.text || h.type}
      />
    ));
  }, [hotspots]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-700">
        Loading Tour...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          to={`/seller/listing/${listingId}/rooms`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to rooms
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      </div>
    );
  }

  if (!listing || !Array.isArray(listing.rooms) || listing.rooms.length === 0) {
    return (
      <div className="flex min-h-[40vh] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600 shadow-sm">
        <p className="text-sm sm:text-base">No rooms found for this property.</p>
        <Link
          to={`/seller/listing/${listingId}/rooms`}
          className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to rooms
        </Link>
      </div>
    );
  }

  if (!room || !imageUrl) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500 shadow-sm">
        {room && !imageUrl ? 'This room has no panorama image.' : 'Room could not be loaded.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/seller/listing/${listingId}/rooms`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Rooms
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Step 3 of 3 · {roleLabel}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Hotspots — {room.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          <strong>Click</strong> the panorama to add a hotspot. Use the list below to edit or delete
          navigation and feature points.
        </p>
      </div>

      <div className="h-[70vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
        <Pannellum
          ref={pannellumRef}
          width="100%"
          height="100%"
          image={imageUrl}
          pitch={0}
          yaw={0}
          hfov={100}
          autoLoad
          showControls
          onMouseup={handlePanoramaMouseUp}
        >
          {hotspotElements != null ? hotspotElements : []}
        </Pannellum>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Placed hotspots ({hotspots.length})
        </h2>
        {hotspots.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">None yet — click the panorama to add one.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {hotspots.map((h, index) => {
              const target =
                h.type === 'navigation'
                  ? otherRooms.find(
                      (r) =>
                        String(r._id) ===
                        String(
                          typeof h.targetRoomId === 'object'
                            ? h.targetRoomId?._id || h.targetRoomId
                            : h.targetRoomId
                        )
                    )
                  : null;
              return (
                <li
                  key={h._id || `list-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium capitalize text-slate-900">
                      {h.type}
                      {h.type === 'navigation' && target ? ` → ${target.name}` : ''}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {h.type === 'feature' ? h.description || h.text : h.text || 'Navigation'}
                      {' · '}
                      yaw {formatAngle(h.yaw)}° / pitch {formatAngle(h.pitch)}°
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => openEditModal(index)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => deleteHotspot(index)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalOpen && pendingAngles ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hs-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 id="hs-modal-title" className="text-lg font-semibold text-slate-900">
              {editIndex != null ? 'Edit hotspot' : 'New hotspot'}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-500">
              yaw {formatAngle(pendingAngles.yaw)}° · pitch {formatAngle(pendingAngles.pitch)}°
            </p>

            <form onSubmit={handleSaveHotspot} className="mt-6 space-y-4">
              <div>
                <label htmlFor="hs-type" className="block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  id="hs-type"
                  value={hotspotType}
                  onChange={(e) => setHotspotType(e.target.value)}
                  disabled={saving}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="navigation">Navigation (link to another room)</option>
                  <option value="feature">Feature (text info)</option>
                </select>
              </div>

              {hotspotType === 'navigation' ? (
                <div>
                  <label htmlFor="hs-target" className="block text-sm font-medium text-slate-700">
                    Target room
                  </label>
                  <select
                    id="hs-target"
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    required={hotspotType === 'navigation'}
                    disabled={saving}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">Select room…</option>
                    {otherRooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {otherRooms.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-700">Add another room to link navigation.</p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <label htmlFor="hs-desc" className="block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    id="hs-desc"
                    rows={4}
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    required={hotspotType === 'feature'}
                    disabled={saving}
                    placeholder="Describe this feature for buyers…"
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                      Saving…
                    </>
                  ) : editIndex != null ? (
                    'Update hotspot'
                  ) : (
                    'Save hotspot'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
