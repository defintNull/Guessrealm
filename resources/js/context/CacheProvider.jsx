import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CacheContext = createContext();

export function CacheProvider({ children }) {
    const [enableCacheLoad, setEnableCacheLoad] = useState(true);

    return (
        <CacheContext.Provider value={{ enableCacheLoad, setEnableCacheLoad }}>
            {children}
        </CacheContext.Provider>
    );
}

// Hook personalizzato per usare il contesto
export function useEnableCacheLoad() {
    return useContext(CacheContext);
}
