# ✅ Documentazione — Parte React

> Breve descrizione, tecnologie utilizzate e struttura della parte React del progetto Guessrealm.

## 📌 Descrizione breve
Guessrealm è un'applicazione web sviluppata con il framework **Laravel**, progettata per offrire un'esperienza interattiva e coinvolgente.  
L'app consente agli utenti di partecipare al classico gioco di Indovina Chi reso più dinamico attraverso l'introduzione di un modello di ML per l'analisi
facciale dei volti in modo da garantire una partita con volti più vari rispetto ad un set specifico con caratteristiche hardcodate.  
Consiste in due modalità, una singleplayer contro un bot con difficoltà regolabile e una multiplayer contro un altro giocatore in tempo reale.  
La cartella `resources/js` contiene tutta la logica frontend basata su React per pagine, componenti e gestione dello stato dell'app.

## ⚙️ Tecnologie e librerie React utilizzate
- **React (JSX/TSX)** — UI component-driven
- **Vite** — build tool e dev server (configurato in `vite.config.js`)
- **React Router** — routing (file: `router/router.jsx`)
- **Context API** — gestione dello stato condiviso (es. `AuthProvider`, `LobbyProvider`, `MultiplayerGameProvider`)
- **Custom hooks** — utilità e comportamenti riutilizzabili (`hooks/`)
- **Tailwind / CSS personalizzato** — stile (file: `css/app.css`)
- **WebSocket / Eventi** — integrazione con backend realtime (utilizzata nelle `providers` e nei servizi)
- **ONNX/AI client** — per utilizzo modello di AI per analisi volti

## 🗂 Struttura della cartella `resources/js`

- `App.jsx` — entrypoint principale dell'app React
- `bootstrap.js` — bootstrap dell'app (setup globale)
- `main.jsx` — montaggio di React nell'HTML
- `router/` — definizione delle rotte e middleware
  - `router.jsx`
  - `middlewares/` (es. `AuthMiddleware.jsx`, `LobbyMiddleware.jsx`)
- `components/` — componenti UI e di pagina riutilizzabili
  - `ui/` — componenti della libreria shadcn
  - componenti creati per il sistema (Chat, Photo, Timer, ecc.)
- `context/` — Provider e contesti globali (`AuthProvider.jsx`, `LobbyProvider.jsx`, ...)
- `hooks/` — custom hooks (es. `use-mobile.ts`, `useDebounce.jsx`)
- `layouts/` — layout wrapper per pagine (`DefaultLayout.jsx`)
- `lib/` — helper e funzioni comuni (`cropImage.js`, `utils.ts`)
- `pages/` — views/route components (Home, Lobby, MultiplayerGame, Profile, ecc.)
- `services/` — service utilizzati durante la partita per compotamento bot e ai (es. `BOT.js`, `Questions.js`, `ai_bot/`)
- `css/` — file di stile (es. `app.css`)
- `views/` — template blade che integrano l'app React (`App.blade.php`)

