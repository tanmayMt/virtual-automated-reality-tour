import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { clearAuthStorage, getStoredUser } from '../utils/authStorage.js';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'buyer') {
    return <Navigate to="/seller/dashboard" replace />;
  }

  function handleLogout() {
    clearAuthStorage();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Buyer account</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="text-slate-600 transition hover:text-slate-900">
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white transition hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Welcome</h2>
          <p className="mt-2 text-slate-600">
            You&apos;re signed in as a buyer. Browse listings from the home page and open virtual tours
            anytime.
          </p>
          <dl className="mt-8 space-y-4 border-t border-slate-100 pt-8 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Name</dt>
              <dd className="mt-1 text-slate-900">{user.name || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-900">{user.email || '—'}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
