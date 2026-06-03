import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../../contexts/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
  /** Si fourni, seuls ces rôles peuvent accéder ; sinon tout utilisateur authentifié. */
  roles?: Role[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
