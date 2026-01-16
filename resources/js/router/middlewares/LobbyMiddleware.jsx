import { useEnableLobby } from "@/context/LobbyProvider";
import { Navigate } from "react-router-dom";

export function LobbyMiddleware({ children }) {
    const { enableLobby } = useEnableLobby();

    if (enableLobby) {
        return children;
    }

    return <Navigate to="/" replace />;
}
