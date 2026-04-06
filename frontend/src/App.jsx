import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, Outlet } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import HomePage from './pages/HomePage.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import CreateListing from './pages/CreateListing.jsx';
import PropertyIntro from './pages/PropertyIntro.jsx';
import TourViewer from './pages/TourViewer.jsx';
import HotspotEditorPage from './pages/HotspotEditorPage.jsx';
import RoomManager from './components/RoomManager.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SellerOnlyRoute from './components/SellerOnlyRoute.jsx';
import { clearAuthStorage, getStoredUser } from './utils/authStorage.js';

function AppHeader() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  function handleLogout() {
    clearAuthStorage();
    navigate('/login', { replace: true });
  }

  if (!token || !user || user.role === 'buyer') {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <NavLink
          to="/seller/dashboard"
          className="text-lg font-semibold tracking-tight text-slate-900 transition hover:text-blue-700"
        >
          Virtual Tour
          <span className="ml-2 text-sm font-normal text-slate-500">Seller</span>
        </NavLink>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <NavLink
            to="/seller/dashboard"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/seller/create"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-medium transition ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
            }
          >
            New tour
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}

function SellerLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Public listing intro — `id` → GET /api/listings/:id */}
        <Route path="/property/:id" element={<PropertyIntro />} />
        {/* Buyer 360° viewer — `id` is listing id */}
        <Route path="/tour/:id" element={<TourViewer />} />
        <Route
          path="/buyer-dashboard"
          element={
            <ProtectedRoute>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route element={<SellerLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/seller/dashboard"
            element={
              <SellerOnlyRoute>
                <SellerDashboard />
              </SellerOnlyRoute>
            }
          />
          <Route
            path="/seller/create"
            element={
              <SellerOnlyRoute>
                <CreateListing />
              </SellerOnlyRoute>
            }
          />
          <Route
            path="/seller/listing/:listingId/rooms"
            element={
              <SellerOnlyRoute>
                <RoomManager />
              </SellerOnlyRoute>
            }
          />
          {/* Seller hotspot editor — `listingId` & `roomId` in HotspotEditor via useParams() */}
          <Route
            path="/seller/listing/:listingId/room/:roomId/hotspots"
            element={
              <SellerOnlyRoute>
                <HotspotEditorPage />
              </SellerOnlyRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
