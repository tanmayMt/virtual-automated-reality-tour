import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pannellum } from 'pannellum-react';
import api from '../api/axios.js';

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

/**
 * Step 3: place hotspots on the 360° panorama (modal flow after canvas interaction).
 *
 * @param {object} props
 * @param {object} props.listing — populated listing with `rooms`
 * @param {object} props.room — current room (includes `hotspots`, `imageUrl`, `_id`)
 * @param {string} props.listingId
 * @param {string} props.roomId
 * @param {() => void} [props.onHotspotsSaved] — refetch parent listing after save
 */
export default function HotspotEditor({ listing, room, listingId, roomId, onHotspotsSaved }) {
  const pannellumRef = useRef(null);
  const [hotspots, setHotspots] = useState(() =>
    Array.isArray(room?.hotspots) ? [...room.hotspots] : []
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAngles, setPendingAngles] = useState(null);
  const [hotspotType, setHotspotType] = useState('navigation');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHotspots(Array.isArray(room?.hotspots) ? [...room.hotspots] : []);
  }, [room]);

  const otherRooms = useMemo(
    () => (listing?.rooms || []).filter((r) => String(r._id) !== String(roomId)),
    [listing?.rooms, roomId]
  );

  const handlePanoramaMouseUp = useCallback(() => {
    const inst = pannellumRef.current;
    if (!inst || typeof inst.getViewer !== 'function') {
      return;
    }
    const viewer = inst.getViewer();
    if (!viewer || typeof viewer.getYaw !== 'function' || typeof viewer.getPitch !== 'function') {
      return;
    }
    const yaw = viewer.getYaw();
    const pitch = viewer.getPitch();
    setPendingAngles({ yaw, pitch });
    setHotspotType('navigation');
    setTargetRoomId('');
    setFeatureDescription('');
    setModalOpen(true);
  }, []);

  function closeModal() {
    setModalOpen(false);
    setPendingAngles(null);
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

    const newHotspot = {
      type: hotspotType,
      yaw: pendingAngles.yaw,
      pitch: pendingAngles.pitch,
      text,
      description,
      targetRoomId: hotspotType === 'navigation' ? navTarget : null,
    };

    const payload = [...hotspots, newHotspot];
    setSaving(true);
    try {
      const { data } = await api.put(`/rooms/${roomId}/hotspots`, { hotspots: payload });
      const updated = data?.data;
      const next = Array.isArray(updated?.hotspots) ? updated.hotspots : payload;
      setHotspots(next);
      closeModal();
      if (typeof onHotspotsSaved === 'function') {
        onHotspotsSaved();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      window.alert(msg);
    } finally {
      setSaving(false);
    }
  }

  const imageUrl = room?.imageUrl;

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

  if (!imageUrl) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500 shadow-sm">
        This room has no panorama image.
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
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">Step 3 of 3</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Hotspots — {room.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          <strong>Click</strong> (press and release) on the panorama where you want a hotspot. A form
          will open with the captured <span className="font-mono text-slate-800">yaw</span> and{' '}
          <span className="font-mono text-slate-800">pitch</span>.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
        <Pannellum
          ref={pannellumRef}
          width="100%"
          height="520px"
          image={imageUrl}
          pitch={0}
          yaw={0}
          hfov={100}
          autoLoad
          showControls
          onMouseup={handlePanoramaMouseUp}
        >
          {hotspotElements}
        </Pannellum>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-medium text-slate-800">Hotspots placed:</span> {hotspots.length}
        {pendingAngles && !modalOpen ? (
          <span className="ml-3 font-mono text-xs text-slate-500">
            Last angles: yaw {formatAngle(pendingAngles.yaw)}°, pitch {formatAngle(pendingAngles.pitch)}°
          </span>
        ) : null}
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
              New hotspot
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
