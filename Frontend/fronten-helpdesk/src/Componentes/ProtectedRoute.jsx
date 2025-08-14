import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirige a /login pero guarda la ubicación actual para volver después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirige a página no autorizada si el rol no coincide
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;