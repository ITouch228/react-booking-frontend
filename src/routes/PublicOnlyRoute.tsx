import { Navigate, Outlet, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PublicOnlyRoute = () => {
  const query = useParams();
  const { user } = useAuth();

  if (user) {
    const next = query?.next || '/profile';
    return <Navigate to={next} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
