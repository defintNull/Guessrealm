import { useState, useEffect } from "react";
import axios from "axios";
import SideChat from "@/components/SideChat";
import { useAuth } from "@/context/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Plus,
    Search,
    MessageSquare,
    MoreVertical,
    Settings,
    Loader2,
} from "lucide-react";
import NewChatDialog from "@/components/NewChatDialog";

// Funzione Helper (Invariata)
const getAvatarInitials = (entity) => {
    if (!entity) return "??";
    if (entity.name && entity.surname) {
        return `${entity.name.charAt(0)}${entity.surname.charAt(
            0
        )}`.toUpperCase();
    }
    if (entity.name || entity.username) {
        const displayName = entity.name || entity.username;
        return displayName.substring(0, 2).toUpperCase();
    }
    return "??";
};

export default function Testchat() {
    const { user } = useAuth();

    const [chats, setChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false); // SideChat lo mette a TRUE quando premi invio
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const userInitials = getAvatarInitials(user);

    // 1. FETCH LISTA CHAT (Invariato)
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await axios.get("/spa/chats");
                setChats(res.data.data);
                setIsLoadingChats(false);
            } catch (error) {
                console.error("Errore caricamento lista chat:", error);
                setIsLoadingChats(false);
            }
        };
        fetchChats();
    }, []);

    // 2. FETCH MESSAGGI (Invariato)
    useEffect(() => {
        if (!selectedChatId) return;
        const controller = new AbortController();
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/spa/chats/${selectedChatId}`, {
                    signal: controller.signal,
                });
                setMessages(res.data.data);
            } catch (error) {
                if (!axios.isCancel(error)) console.error(error);
            }
        };
        fetchMessages();
        const intervalId = setInterval(fetchMessages, 3000);
        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [selectedChatId]);

    // =========================================================================
    // 🚀 3. LOGICA DI INVIO MESSAGGI (NUOVO)
    // =========================================================================
    useEffect(() => {
        // Questa logica parte SOLO se SideChat ha messo isSending a true
        if (isSending && messages.length > 0) {
            // 1. Recuperiamo il messaggio "temporaneo" che SideChat ha appena aggiunto alla lista
            const messageToSend = messages[messages.length - 1];

            // 2. Facciamo la chiamata reale al backend
            axios
                .post(`/spa/chats/${selectedChatId}`, {
                    content: messageToSend.content,
                })
                .then((res) => {
                    // SUCCESSO: Il server ci risponde con il messaggio "Vero" (con ID reale, timestamp corretto, ecc.)
                    const realMessage = res.data.data;

                    // Sostituiamo il messaggio "temporaneo" con quello "reale" nella lista
                    setMessages((prev) =>
                        prev.map((msg, index) =>
                            // Se è l'ultimo messaggio (quello appena inviato), lo aggiorniamo
                            index === prev.length - 1 ? realMessage : msg
                        )
                    );
                })
                .catch((error) => {
                    console.error("Errore invio messaggio:", error);
                    // Opzionale: Qui potresti mostrare un toast di errore o rimuovere il messaggio fallito
                })
                .finally(() => {
                    // 3. Sblocchiamo la chat permettendo nuovi invii
                    setIsSending(false);
                });
        }
    }, [isSending]); // <-- Ascolta i cambiamenti di questa variabile

    // ... RESTO DEL RENDER (Invariato) ...
    const activeChatObj = chats.find((c) => c.id === selectedChatId);
    const activeChatName = activeChatObj
        ? activeChatObj.surname
            ? `${activeChatObj.name} ${activeChatObj.surname}`
            : activeChatObj.name
        : "Chat";

    const handleChatCreated = (chatObj) => {
        // Se la chat esiste già nella lista, non la aggiungiamo doppia
        setChats((prev) => {
            if (prev.find((c) => c.id === chatObj.id)) return prev;
            return [chatObj, ...prev]; // Aggiungiamo in cima
        });

        // La apriamo subito
        setSelectedChatId(chatObj.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-background text-foreground overflow-hidden">
            {/* LATO SINISTRO */}
            <div className="w-80 border-r border-border flex flex-col bg-card/50">
                <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80">
                            <AvatarImage src={user?.profile_picture_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm truncate max-w-[120px]">
                            {user
                                ? user.surname
                                    ? `${user.name} ${user.surname}`
                                    : user.name || user.username
                                : "Messaggi"}
                        </span>
                    </div>
                    {/* Header Sidebar */}
                    <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
                        <div className="flex items-center gap-3">
                            {/* ... avatar utente ... */}
                        </div>

                        {/* SOSTITUISCI IL VECCHIO BUTTON CON QUESTO: */}
                        <NewChatDialog onChatCreated={handleChatCreated} />
                    </div>
                </div>

                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cerca chat..."
                            className="pl-9 h-9 bg-background/50 border-muted-foreground/20"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-2 mt-2">
                    {isLoadingChats ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 pb-4">
                            {chats.map((chat) => {
                                const chatInitials = getAvatarInitials(chat);
                                const displayName = chat.surname
                                    ? `${chat.name} ${chat.surname}`
                                    : chat.name;
                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() =>
                                            setSelectedChatId(chat.id)
                                        }
                                        className={`flex items-center gap-3 p-3 rounded-md text-left transition-all hover:bg-accent/50 ${
                                            selectedChatId === chat.id
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        <Avatar className="h-10 w-10 border border-border/50">
                                            <AvatarImage src={chat.avatar} />
                                            <AvatarFallback>
                                                {chatInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-baseline">
                                                <span
                                                    className={`text-sm font-medium truncate ${
                                                        selectedChatId ===
                                                        chat.id
                                                            ? "text-foreground"
                                                            : ""
                                                    }`}
                                                >
                                                    {displayName}
                                                </span>
                                                <span className="text-[10px] opacity-70">
                                                    {chat.time}
                                                </span>
                                            </div>
                                            <p className="text-xs truncate opacity-70 mt-0.5">
                                                {chat.lastMessage}
                                            </p>
                                        </div>
                                        {chat.unread > 0 && (
                                            <span className="bg-primary text-primary-foreground text-[10px] h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full ml-1">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-3 border-t border-border flex justify-between items-center text-muted-foreground">
                    <span className="text-xs">v1.0.0</span>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* LATO DESTRO */}
            <div className="flex-1 flex flex-col min-w-0 bg-background relative">
                {selectedChatId ? (
                    <>
                        <div className="h-16 px-6 flex items-center justify-between border-b border-border shrink-0 bg-background/95 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h2 className="font-semibold text-lg leading-none">
                                        {activeChatName}
                                    </h2>
                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <span className="block w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
                                        Online
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setIsSearchOpen(!isSearchOpen)
                                    }
                                    className={isSearchOpen ? "bg-accent" : ""}
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {isSearchOpen && (
                            <div className="px-6 py-2 border-b border-border bg-accent/10 animate-in slide-in-from-top-2">
                                <Input
                                    placeholder="Cerca..."
                                    className="h-9"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex-1 overflow-hidden">
                            <SideChat
                                chatId={selectedChatId}
                                messages={messages}
                                setMessages={setMessages}
                                isSending={isSending}
                                setIsSending={setIsSending}
                                className="h-full border-none shadow-none rounded-none [&_.card-header]:hidden"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                        <p>Seleziona una chat per iniziare</p>
                    </div>
                )}
            </div>
        </div>
    );
}
