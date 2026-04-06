import React from 'react';
import { useNavigate } from 'react-router-dom';

function formatPrice(price) {
  if (typeof price === 'number' && !Number.isNaN(price)) {
    return `$${price.toLocaleString()}`;
  }
  return price != null ? String(price) : '—';
}

export default function PropertyCard({ listing }) {
  const navigate = useNavigate();
  const id = listing?._id || listing?.id;
  const title = listing?.title || 'Untitled';
  const address = listing?.address || '';
  const thumbnail = listing?.thumbnail;

  function handleClick() {
    if (id) {
      navigate(`/property/${id}`);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 ease-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400">
            No preview
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-5 py-4">
        <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="line-clamp-2 text-sm text-slate-600">{address}</p>
        <p className="mt-2 text-xl font-semibold text-slate-900">{formatPrice(listing?.price)}</p>
      </div>
    </article>
  );
}
