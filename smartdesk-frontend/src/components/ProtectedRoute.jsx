import { Navigate } from "react-router-dom";

function getStoredRole(user) {
  return typeof user?.role === "string"
    ? user.role
    : user?.role?.role || user?.role_name || user?.rolename;
}

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  const role = getStoredRole(user);

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
