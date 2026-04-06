import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import HotspotEditor from '../components/HotspotEditor.jsx';

function Spinner() {
  return (
    <span
      className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
      aria-hidden
    />
  );
}

/**
 * Loads listing + room from the route, then renders HotspotEditor with required props.
 */
export default function HotspotEditorPage() {
  const { listingId, roomId } = useParams();
  const [listing, setListing] = useState(null);
  const [room, setRoom] = useState(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const { data } = await api.get(`/listings/${listingId}`);
      const list = data?.data;
      setListing(list || null);
      const rooms = list?.rooms || [];
      const current = rooms.find((r) => String(r._id) === String(roomId));
      if (!current) {
        setRoom(null);
        setLoadError('Room not found on this listing.');
        return;
      }
      setRoom(current);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load';
      setLoadError(msg);
      setListing(null);
      setRoom(null);
    }
  }, [listingId, roomId]);

  useEffect(() => {
    load();
  }, [load]);

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

  if (!listing || !room) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Spinner />
        <p className="text-sm text-slate-500">Loading hotspot editor…</p>
      </div>
    );
  }

  return (
    <HotspotEditor
      listing={listing}
      room={room}
      listingId={listingId}
      roomId={roomId}
      onHotspotsSaved={load}
    />
  );
}
