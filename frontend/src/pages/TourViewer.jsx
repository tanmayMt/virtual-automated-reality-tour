import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import PanoramaCanvas from '../components/PanoramaCanvas.jsx';
import RoomSelectorBar from '../components/RoomSelectorBar.jsx';
import {
  collectAllNavigationTargetImageUrls,
  collectNavigationTargetImageUrls,
  preloadPanoramaImages,
} from '../utils/preloadPanoramaImages.js';

function roomKey(r) {
  if (r == null) {
    return '';
  }
  if (r._id != null) {
    return String(r._id);
  }
  if (r.id != null) {
    return String(r.id);
  }
  return '';
}

export default function TourViewer() {
  const { listingId } = useParams();
  const [tourData, setTourData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const preloadedUrlsRef = useRef(new Set());

  const currentRoom = useMemo(
    () => rooms.find((r) => roomKey(r) === String(currentRoomId)) || null,
    [rooms, currentRoomId]
  );

  /** Validates id against loaded rooms before updating state. */
  const setCurrentRoomIdSafe = useCallback(
    (roomId) => {
      const id = String(roomId);
      if (rooms.some((r) => roomKey(r) === id)) {
        setCurrentRoomId(id);
      }
    },
    [rooms]
  );

  useEffect(() => {
    if (rooms.length === 0 || currentRoomId == null) {
      return;
    }
    const exists = rooms.some((r) => roomKey(r) === String(currentRoomId));
    if (!exists) {
      setCurrentRoomId(roomKey(rooms[0]));
    }
  }, [rooms, currentRoomId]);

  useEffect(() => {
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return;
    }
    const cache = preloadedUrlsRef.current;
    preloadPanoramaImages(collectAllNavigationTargetImageUrls(rooms), cache);
    for (const r of rooms) {
      const u = r?.imageUrl;
      if (typeof u === 'string' && u.length > 0) {
        preloadPanoramaImages([u], cache);
      }
    }
  }, [rooms]);

  useEffect(() => {
    if (!currentRoomId || rooms.length === 0) {
      return;
    }
    const cache = preloadedUrlsRef.current;
    preloadPanoramaImages(collectNavigationTargetImageUrls(rooms, currentRoomId), cache);
  }, [rooms, currentRoomId]);

  useEffect(() => {
    let cancelled = false;
    async function loadTour() {
      setIsLoading(true);
      setLoadError('');
      try {
        const { data } = await api.get(`/tour/${listingId}`);
        const payload = data?.data;
        if (cancelled) {
          return;
        }
        const list = Array.isArray(payload?.rooms) ? payload.rooms : [];
        setTourData(payload || null);
        setRooms(list);
        const first = list.find((r) => r && roomKey(r) !== '');
        if (first) {
          setCurrentRoomId(roomKey(first));
        } else {
          setCurrentRoomId(null);
        }
      } catch (err) {
        console.error('TourViewer: tour load failed', err);
        if (cancelled) {
          return;
        }
        const msg = err.response?.data?.message || err.message || 'Tour could not be loaded';
        setLoadError(msg);
        setTourData(null);
        setRooms([]);
        setCurrentRoomId(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    loadTour();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        Loading Tour...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 z-[200] flex h-[100vh] w-[100vw] flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <p className="max-w-md text-sm text-red-300 sm:text-base">{loadError}</p>
        <Link
          to="/"
          className="mt-8 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          Back
        </Link>
      </div>
    );
  }

  if (!tourData || !Array.isArray(tourData.rooms) || tourData.rooms.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black px-6 text-center text-white">
        <p className="max-w-md text-sm sm:text-base">No rooms found for this property.</p>
        <Link
          to="/"
          className="mt-8 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          Back
        </Link>
      </div>
    );
  }

  if (rooms.length > 0 && !currentRoom) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        Loading Tour...
      </div>
    );
  }

  return (
    <div className="tour-fullscreen fixed inset-0 z-[150] h-[100vh] w-[100vw] overflow-hidden bg-black">
      {/* Full-screen 360° layer — explicit viewport size for Pannellum */}
      <div className="absolute inset-0 h-screen w-screen">
        <PanoramaCanvas currentRoom={currentRoom} setCurrentRoomId={setCurrentRoomIdSafe} />
      </div>

      {/* Top header — glass strip */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {tourData.title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-white/70">{tourData.address}</p>
            {typeof tourData.price === 'number' ? (
              <p className="mt-2 text-xl font-semibold tabular-nums text-white sm:text-2xl">
                ${tourData.price.toLocaleString()}
              </p>
            ) : null}
          </div>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Exit
          </Link>
        </div>
      </header>

      <RoomSelectorBar
        rooms={rooms}
        currentRoomId={currentRoomId}
        setCurrentRoomId={setCurrentRoomIdSafe}
      />
    </div>
  );
}
