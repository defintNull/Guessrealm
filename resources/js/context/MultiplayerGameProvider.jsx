import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const MultiplayerGameContext = createContext();

export function MultiplayerGameProvider({ children }) {
    const [enableMultiplayerGame, setEnableMultiplayerGame] = useState(false);

    return (
        <MultiplayerGameContext.Provider value={{ enableMultiplayerGame, setEnableMultiplayerGame }}>
            {children}
        </MultiplayerGameContext.Provider>
    );
}

// Hook personalizzato per usare il contesto
export function useEnableMultiplayerGame() {
    return useContext(MultiplayerGameContext);
}
