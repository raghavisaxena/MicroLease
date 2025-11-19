import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;
    
    if (role !== 'admin') {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    return <Navigate to="/admin/login" replace />;
  }
};

export default AdminRoute;
