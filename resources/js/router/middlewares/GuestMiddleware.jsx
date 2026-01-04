import { useAuth } from "@/context/AuthProvider";
import { Navigate } from "react-router-dom";

export function GuestMiddleware({ children }) {
    const { user } = useAuth();
    console.log(user);

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
}
