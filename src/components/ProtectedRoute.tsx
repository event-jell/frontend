import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden animate-pulse">
        {/* Top Navbar Skeleton */}
        <div className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-200" />
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-slate-100 rounded-xl" />
            <div className="w-9 h-9 rounded-full bg-slate-200" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="h-3.5 w-24 bg-slate-200 rounded-full" />
            <div className="h-7 w-60 bg-slate-200 rounded-xl" />
            <div className="h-3 w-80 bg-slate-100 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
