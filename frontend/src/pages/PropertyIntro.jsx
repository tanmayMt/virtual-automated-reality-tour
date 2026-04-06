import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';

function IntroSkeleton() {
  return (
    <div className="fixed inset-0 h-screen w-screen animate-pulse bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/30" />
      <div className="absolute left-1/2 top-8 h-8 w-64 -translate-x-1/2 rounded-md bg-white/15" />
      <div className="absolute left-1/2 top-20 h-5 w-80 -translate-x-1/2 rounded-md bg-white/10" />
      <div className="absolute bottom-16 left-1/2 h-14 w-64 -translate-x-1/2 rounded-2xl bg-white/20" />
    </div>
  );
}

export default function PropertyIntro() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadListing() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/listings/${listingId}`);
        if (cancelled) {
          return;
        }
        setListing(data?.data || null);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const msg = err.response?.data?.message || err.message || 'Could not load property intro';
        setError(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadListing();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  function enterTour() {
    navigate(`/tour/${listingId}`);
  }

  if (loading) {
    return <IntroSkeleton />;
  }

  if (error || !listing) {
    return (
      <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-black px-5 text-center">
        <div>
          <p className="text-red-300">{error || 'Property unavailable'}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="fixed inset-0 h-screen w-screen overflow-hidden bg-black text-white">
      {listing.introVideoUrl ? (
        <video
          className="h-full w-full object-cover"
          src={listing.introVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          onEnded={enterTour}
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.28),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(15,23,42,0.85),rgba(2,6,23,1))]" />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/35" />

      <div className="absolute right-5 top-5 z-20">
        <button
          type="button"
          onClick={enterTour}
          className="rounded-lg border border-white/25 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          Skip Intro
        </button>
      </div>

      <div className="absolute inset-x-0 top-10 z-20 px-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{listing.title}</h1>
        <p className="mt-2 text-sm text-white/80 sm:text-base">{listing.address}</p>
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
        <button
          type="button"
          onClick={enterTour}
          className="rounded-2xl border border-blue-300/55 bg-blue-600/85 px-8 py-4 text-lg font-semibold text-white shadow-[0_0_35px_rgba(59,130,246,0.55)] transition duration-300 hover:scale-105 hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Enter Virtual Tour
        </button>
      </div>
    </section>
  );
}

