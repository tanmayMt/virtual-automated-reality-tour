import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import api from '../api/axios.js';
import {
  clearAuthStorage,
  dashboardPathForRole,
  getStoredUser,
  persistAuthFromResponse,
} from '../utils/authStorage.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  let token = localStorage.getItem('token');
  const storedUser = getStoredUser();
  if (token && !storedUser) {
    clearAuthStorage();
    token = localStorage.getItem('token');
  }
  if (token && storedUser) {
    return <Navigate to={dashboardPathForRole(storedUser.role)} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token: jwt, user } = persistAuthFromResponse(data);
      if (!jwt) {
        setError('Unexpected response from server');
        return;
      }
      navigate(dashboardPathForRole(user?.role || 'seller'), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-900">Seller sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use an account with role <span className="font-medium text-blue-600">seller</span>, or staff
          (admin / manager).
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2"
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="font-medium text-blue-600 transition hover:text-blue-700">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
