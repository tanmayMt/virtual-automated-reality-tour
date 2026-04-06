import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import PropertyIntroMap from '../components/PropertyIntroMap.jsx';

/** Auto-advance after intro video (6–8s range). Map path has no auto-advance. */
const VIDEO_AUTO_ADVANCE_MS = 7200;

function LoadingIntro() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
      <div
        className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-amber-400"
        aria-hidden
      />
      <p className="mt-6 text-sm font-medium tracking-[0.2em] text-white/50">
        Loading Property Experience...
      </p>
    </div>
  );
}

function parseListingCoords(listing) {
  const lat = Number(listing?.location?.lat);
  const lng = Number(listing?.location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng };
  }
  return null;
}

export default function PropertyIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoFailed, setVideoFailed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const audioRef = useRef(null);
  const ambientUrl = import.meta.env.VITE_INTRO_AMBIENT_AUDIO_URL || '';

  const enterTour = useCallback(() => {
    setFadeOut(true);
    window.setTimeout(() => {
      navigate(`/tour/${id}`);
    }, 480);
  }, [id, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function loadListing() {
      setLoading(true);
      setError('');
      setVideoFailed(false);
      try {
        const { data } = await api.get(`/listings/${id}`);
        console.log('Listing Data:', data);
        if (cancelled) {
          return;
        }
        setListing(data?.data ?? null);
      } catch (err) {
        console.error('PropertyIntro: GET /api/listings/:id failed', err);
        if (!cancelled) {
          const msg = err.response?.data?.message || err.message || 'Could not load this property.';
          setError(msg);
          setListing(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    if (id) {
      loadListing();
    } else {
      setError('Missing property id in URL.');
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [id]);

  const coords = useMemo(() => (listing ? parseListingCoords(listing) : null), [listing]);

  const hasVideo =
    typeof listing?.introVideoUrl === 'string' && listing.introVideoUrl.trim().length > 0;

  const showVideoLayer = hasVideo && !videoFailed;
  const showMapLayer = !showVideoLayer;

  /** Video intro: auto-advance to tour after delay. Map intro: user-driven only. */
  useEffect(() => {
    if (!listing || !showVideoLayer) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      enterTour();
    }, VIDEO_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [listing, showVideoLayer, enterTour]);

  const mapKey = coords ? `${coords.lat},${coords.lng}` : listing?.address || 'map';

  if (loading) {
    return <LoadingIntro />;
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <p className="text-lg font-semibold text-red-200">Unable to load property</p>
          <p className="mt-3 text-sm text-white/70">{error || 'Property unavailable.'}</p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:scale-105 hover:bg-white/20"
          >
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`fixed inset-0 z-[100] h-screen w-screen overflow-hidden bg-black text-white transition-opacity duration-500 ease-out ${
        fadeOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {ambientUrl ? (
        <audio ref={audioRef} src={ambientUrl} loop muted playsInline className="hidden" />
      ) : null}

      {/* Hero media */}
      <div className="absolute inset-0 h-full w-full">
        {showVideoLayer ? (
          <video
            className="h-full w-full object-cover"
            src={listing.introVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={() => {
              console.error('PropertyIntro: intro video failed to load, falling back to map');
              setVideoFailed(true);
            }}
          />
        ) : (
          <PropertyIntroMap
            key={mapKey}
            lat={coords?.lat}
            lng={coords?.lng}
            title={listing.title}
            address={listing.address}
          />
        )}
      </div>

      {/* Premium gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

      {/* Skip intro */}
      <div className="absolute right-5 top-5 z-30 sm:right-8 sm:top-8">
        <button
          type="button"
          onClick={enterTour}
          className="rounded-full border border-white/25 bg-black/35 px-4 py-2 text-sm font-medium text-white/95 backdrop-blur-md transition hover:bg-black/55"
        >
          Skip Intro
        </button>
      </div>

      {/* Optional: unmute ambiance */}
      {ambientUrl ? (
        <div className="absolute left-5 top-5 z-30 sm:left-8 sm:top-8">
          <button
            type="button"
            className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md hover:bg-black/50"
            onClick={() => {
              const el = audioRef.current;
              if (!el) {
                return;
              }
              el.muted = !el.muted;
              if (!el.muted) {
                el.play().catch(() => {});
              }
            }}
          >
            Sound
          </button>
        </div>
      ) : null}

      {/* Glass card + typography */}
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-[max(5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-center shadow-2xl backdrop-blur-lg sm:px-10 sm:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">
            Exclusive listing
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {listing.title}
          </h1>
          <p className="mt-3 text-sm text-white/75 sm:text-base">{listing.address}</p>
          {typeof listing.price === 'number' && !Number.isNaN(listing.price) ? (
            <p className="mt-4 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
              ${listing.price.toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>

      {/* CTA */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={enterTour}
          className="group relative rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-10 py-4 text-base font-semibold text-neutral-950 shadow-[0_0_40px_rgba(251,191,36,0.45)] transition duration-300 hover:scale-105 hover:shadow-[0_0_56px_rgba(251,191,36,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Enter Virtual Tour
        </button>
      </div>

      {showVideoLayer ? (
        <p className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 text-center text-xs text-white/40">
          Continuing automatically in a few seconds…
        </p>
      ) : null}
    </section>
  );
}
