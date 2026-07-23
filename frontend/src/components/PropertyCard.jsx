import React from 'react';
import { useNavigate } from 'react-router-dom';

function formatPrice(price) {
  if (typeof price === 'number' && !Number.isNaN(price)) {
    return `$${price.toLocaleString()}`;
  }
  return price != null ? String(price) : '—';
}

function formatViewing(iso) {
  if (!iso) {
    return null;
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export default function PropertyCard({ listing }) {
  const navigate = useNavigate();
  const id = listing?._id || listing?.id;
  const title = listing?.title || 'Untitled';
  const address = listing?.address || '';
  const thumbnail = listing?.thumbnail;
  const viewing = formatViewing(listing?.nextViewingAt);

  function go() {
    if (id) {
      navigate(`/property/${id}`);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={handleKeyDown}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:focus-visible:ring-offset-slate-950"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400 dark:from-slate-800 dark:to-slate-900">
            No preview
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-5 py-4">
        <h2 className="line-clamp-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{address}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {listing?.propertyType || 'property'}
        </p>
        <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{formatPrice(listing?.price)}</p>

        <dl className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-800/80">
            <dt className="text-slate-400">Beds</dt>
            <dd className="font-semibold">{listing?.bedrooms ?? '—'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-800/80">
            <dt className="text-slate-400">Baths</dt>
            <dd className="font-semibold">{listing?.bathrooms ?? '—'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-800/80">
            <dt className="text-slate-400">Sqft</dt>
            <dd className="font-semibold">{listing?.areaSqft ? listing.areaSqft.toLocaleString() : '—'}</dd>
          </div>
        </dl>

        <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          {listing?.tourDurationMinutes ? <p>Tour ~{listing.tourDurationMinutes} min</p> : null}
          {viewing ? <p>Next viewing: {viewing}</p> : null}
          {listing?.seller?.name ? <p>Seller: {listing.seller.name}</p> : null}
        </div>
      </div>
    </article>
  );
}
