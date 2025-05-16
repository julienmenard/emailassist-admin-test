import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { checkAdminSession } from '../lib/auth';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { data: admin, isLoading } = useQuery({
    queryKey: ['adminSession'],
    queryFn: checkAdminSession,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    return <Navigate to="/login" />;
  }

  return children;
}