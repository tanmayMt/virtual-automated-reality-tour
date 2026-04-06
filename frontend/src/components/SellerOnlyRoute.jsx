import React from 'react';
import { Navigate } from 'react-router-dom';
import { clearAuthStorage, getStoredUser } from '../utils/authStorage.js';

/**
 * Requires auth and stored user profile; buyers are sent to the buyer dashboard.
 */
export default function SellerOnlyRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const user = getStoredUser();
  if (!user) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'buyer') {
    return <Navigate to="/buyer-dashboard" replace />;
  }
  return children;
}
