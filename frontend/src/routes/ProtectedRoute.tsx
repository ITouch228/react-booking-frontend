import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import type { Role } from '../types';

type ProtectedRouteProps = {
  roles: Role[];
  message?: string;
};

const ProtectedRoute = ({ roles, message }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const isUnauthenticated = !user;
  const isUnauthorized = !!user && !roles.includes(user.role);
  const isGuest = user?.role === 'GUEST';

  useEffect(() => {
    if (isUnauthenticated) {
      toast.warn(message ?? 'Пожалуйста, войдите в систему', {
        toastId: 'guard:login-required',
      });
    } else if (isUnauthorized) {
      toast.warn(message ?? 'У вас нет доступа к этому разделу', {
        toastId: 'guard:forbidden',
      });
    }
  }, [isUnauthenticated, isUnauthorized, message]);

  if (isUnauthenticated) {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (isUnauthorized) {
    if (isGuest) {
      const next = location.pathname + location.search;
      return (
        <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
      );
    }
    return <Navigate to='/bookings' replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
