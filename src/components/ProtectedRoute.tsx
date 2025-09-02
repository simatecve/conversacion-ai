import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireSuperAdmin = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, isSuperAdmin, isClient } = useProfile();
  const location = useLocation();

  console.log('ProtectedRoute - user:', user?.email, 'loading:', authLoading, 'profile:', profile?.profile_type);

  // Show loading while auth or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If profile is not loaded yet, show loading
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Handle super admin routes
  if (requireSuperAdmin && !isSuperAdmin) {
    console.log('Access denied: Super admin required');
    return <Navigate to="/" replace />;
  }

  // Redirect super admin to admin panel if trying to access regular routes
  if (isSuperAdmin && !location.pathname.startsWith('/admin') && !requireSuperAdmin) {
    console.log('Super admin detected, redirecting to admin panel');
    return <Navigate to="/admin" replace />;
  }

  // Redirect regular clients to main panel if trying to access admin routes
  if (isClient && location.pathname.startsWith('/admin')) {
    console.log('Regular client trying to access admin, redirecting to main panel');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;