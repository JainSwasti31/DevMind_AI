import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}
