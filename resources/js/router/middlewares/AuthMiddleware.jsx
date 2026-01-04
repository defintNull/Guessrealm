import { useAuth } from "@/context/AuthProvider";
import { Navigate } from "react-router-dom";

export function AuthMiddleware({ children }) {
    const { user } = useAuth();
    console.log(user);

    if (user) {
        return children;
    }

    return <Navigate to="/" replace />;
}
