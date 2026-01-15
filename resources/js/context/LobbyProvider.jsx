import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const LobbyContext = createContext();

export function LobbyProvider({ children, storageKey = "vite-ui-theme" }) {
    const [enableLobby, setEnableLobby] = useState(false);

    return (
        <LobbyContext.Provider value={{ enableLobby, setEnableLobby }}>
            {children}
        </LobbyContext.Provider>
    );
}

// Hook personalizzato per usare il contesto
export function useEnableLobby() {
    return useContext(LobbyContext);
}
