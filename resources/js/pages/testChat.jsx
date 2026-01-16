import { useState, useEffect } from "react";
import axios from "axios";
import SideChat from "@/components/SideChat";

export default function Testchat() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const CHAT_ID = 1; // In futuro questo arriverà probabilmente da useParams() di React Router

    useEffect(() => {
        const controller = new AbortController();

        const fetchMessages = async () => {
            try {
                // Usiamo Axios per coerenza e gestione automatica dei token
                const res = await axios.get(`/chats/${CHAT_ID}`, {
                    signal: controller.signal,
                });

                // Laravel API Resources restituiscono un oggetto con la chiave 'data'
                // Non serve più mappare manualmente ogni campo, il backend è già allineato!
                setMessages(res.data.data);
                setIsLoading(false);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    console.error("Errore nel caricamento dei messaggi", error);
                }
            }
        };

        // Caricamento iniziale
        fetchMessages();

        // Polling: ogni 3 secondi controlliamo se ci sono nuovi messaggi
        // Nota del Senior: Questo è un approccio "povero". Il vero salto di qualità
        // sarà sostituire questo intervallo con Laravel Echo (WebSockets).
        const intervalId = setInterval(fetchMessages, 3000);

        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [CHAT_ID]);

    return (
        // Il contenitore principale occupa tutta la larghezza e altezza del dispositivo
        <div className="h-screen w-screen flex overflow-hidden bg-background">
            {/* Qui sta il trucco: il wrapper della SideChat deve essere flex-1 
           per prendersi tutto lo spazio orizzontale rimasto (che ora è il 100%)
        */}
            <div className="flex-1 h-full">
                <SideChat
                    chatId={CHAT_ID}
                    messages={messages}
                    setMessages={setMessages}
                    className="h-full border-none shadow-none rounded-none"
                />
            </div>
        </div>
    );
}
