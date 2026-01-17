import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { useEnableLobby } from "@/context/LobbyProvider";
import { useEnableMultiplayerGame } from "@/context/MultiplayerGameProvider";

export default function useExitGamePage(payload) {
    const location = useLocation();

    // Caso 1: cambio route interno
    useEffect(() => {
        return () => {
            payload.cleanup();
            axios.post("/spa/exit", payload);
        };
    }, [location.pathname]);

    // Caso 2: chiusura scheda / refresh
    useEffect(() => {
        const handleUnload = () => {
            payload.cleanup();
            const data = JSON.stringify(payload);
            navigator.sendBeacon("/spa/exit", data);
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);
}
