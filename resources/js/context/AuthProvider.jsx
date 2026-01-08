import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "./ThemeProvider";

// Creiamo il contesto con i valori di default
const AuthContext = createContext();

export function AuthProvider({ children, storageKey = "vite-ui-theme" }) {
    // 1. Stato Utente
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const {theme, setTheme} = useTheme();


    // 4. EFFETTO 2: Fetch Iniziale Utente
    useEffect(() => {
        axios.get("/spa/me")
              .then((res) => {
                  const fetchedUser = res.data.user;
                  setUser(fetchedUser);
                  
                  // Se l'utente ha un tema salvato nel DB, usiamo quello
                  // sovrascrivendo la scelta locale
                  const validThemes = ["light", "dark", "system"];
                  if (fetchedUser.theme && validThemes.includes(fetchedUser.theme)) {
                      setTheme(fetchedUser.theme);
                  }
              })
              .catch(() => setUser(null))
              .finally(() => setLoading(false));
    }, []);

    // 5. EFFETTO 3: Sincronizzazione User -> Theme
    // Se l'utente viene aggiornato (es. dopo il salvataggio profilo), aggiorniamo il tema
    useEffect(() => {
        const validThemes = ["light", "dark", "system"];
        if (user && user.theme && validThemes.includes(user.theme)) {
            // Aggiorniamo lo stato locale solo se è diverso, per evitare loop
            if (user.theme !== theme) {
                setTheme(user.theme);
            }
        }
    }, [user]); // Scatta ogni volta che cambia l'oggetto 'user'

    // Non renderizziamo nulla finché non sappiamo chi è l'utente
    if (loading) return null;

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizzato per usare il contesto
export function useAuth() {
    return useContext(AuthContext);
}