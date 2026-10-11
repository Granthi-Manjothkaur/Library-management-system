import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Only lets logged-in users with an allowed role in.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/student'} replace />;
  }
  return <Outlet />;
}
