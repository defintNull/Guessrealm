import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/spa/me')
        .then(res => setUser({...res.data.user,
          //solo per test, da rimuovere quando il backend sarà aggiornato, non mi uccidere Lorè :)
          theme: "system"}))
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    }, [])

    // momentaneo per modificare il tema prima che il backend sia pronto
    const updateUserTheme = (theme) => {
      setUser(prevUser => ({
        ...prevUser,
        theme: theme
      }));
      console.log("User theme updated to:", theme);
    }

  if (loading) return null

  return (
    <AuthContext.Provider value={{ user, setUser, updateUserTheme }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
