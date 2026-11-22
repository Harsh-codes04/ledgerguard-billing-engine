import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function SessionLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-slate-200">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
        <p className="mt-4 text-sm font-semibold">Checking your workspace session…</p>
      </div>
    </main>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children || <Outlet />;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
