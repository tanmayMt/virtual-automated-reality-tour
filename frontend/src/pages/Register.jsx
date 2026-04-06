import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import api from '../api/axios.js';
import {
  clearAuthStorage,
  dashboardPathForRole,
  getStoredUser,
  persistAuthFromResponse,
} from '../utils/authStorage.js';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('seller');
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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      const { token: jwt, user } = persistAuthFromResponse(data);
      if (!jwt) {
        setError('Unexpected response from server');
        return;
      }
      navigate(dashboardPathForRole(user?.role || role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Register as a <span className="font-medium text-blue-600">seller</span> to manage listings
          and tours, or as a <span className="font-medium text-slate-800">buyer</span> for future
          buyer-only features.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700">
              I am a
            </label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2"
            >
              <option value="seller">Seller (list properties &amp; 360° tours)</option>
              <option value="buyer">Buyer</option>
            </select>
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-2"
            />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              'Create account'
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 transition hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
