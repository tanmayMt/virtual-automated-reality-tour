import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className} ${
        isDark
          ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}

export function PublicNav() {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      <ThemeToggle />
      <Link
        to="/login"
        className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Seller login
      </Link>
      <Link
        to="/register"
        className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700"
      >
        Register
      </Link>
    </nav>
  );
}
