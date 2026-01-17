import { useEnableMultiplayerGame } from "@/context/MultiplayerGameProvider";
import { Navigate } from "react-router-dom";

export function MultiplayerGameMiddleware({ children }) {
    const { enableMultiplayerGame } = useEnableMultiplayerGame();

    if (enableMultiplayerGame) {
        return children;
    }

    return <Navigate to="/" replace />;
}
