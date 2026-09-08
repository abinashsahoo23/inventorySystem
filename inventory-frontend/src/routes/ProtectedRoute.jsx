import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../components/auth/session";
import { canAccess } from "./routeConfig";

export default function ProtectedRoute({ route }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!route) {
    return <Outlet />;
  }

  if (!canAccess(route, user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}