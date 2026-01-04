import { useAuth } from "@/context/AuthProvider";
import { Navigate } from "react-router-dom";

export function GuestMiddleware({ children }) {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
}
