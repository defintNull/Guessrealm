import { useState, useEffect } from "react";
import axios from "axios";
import SideChat from "@/components/SideChat";
import { useAuth } from "@/context/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import NewChatDialog from "@/components/NewChatDialog";
import NewGroupDialog from "@/components/NewGroupDialog";
import echo from "@/echo"; 

// Funzione Helper
const getAvatarInitials = (entity) => {
    if (!entity) return "??";
    if (entity.name && entity.surname) {
        return `${entity.name.charAt(0)}${entity.surname.charAt(0)}`.toUpperCase();
    }
    if (entity.name || entity.username) {
        const displayName = entity.name || entity.username;
        return displayName.substring(0, 2).toUpperCase();
    }
    return "??";
};

export default function Chat() {
    const { user } = useAuth();

    const [chats, setChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const userInitials = getAvatarInitials(user);

    // --- A. GESTIONE PRESENZE (Canale 'online') ---
    useEffect(() => {
        // Unisciti al canale di presenza globale
        const channel = echo.join('online');

        channel
            .here(users => setOnlineUsers(users.map(u => u.id)))
            .joining(user => setOnlineUsers(prev => [...prev, user.id]))
            .leaving(user => setOnlineUsers(prev => prev.filter(id => id !== user.id)));

        return () => echo.leave('online');
    }, []);

    // --- B. GESTIONE MESSAGGI REAL-TIME (Canale Utente) ---
    useEffect(() => {
        if (!user?.id) return;

        // Ascoltiamo il canale privato dell'utente corrente
        const channel = echo.private('chat.' + user.id);

        // 1. Nuove chat create (es. qualcuno mi aggiunge a un gruppo)
        channel.listen('ChatGroupEvent', (e) => {
            setChats(prev => [e.chat, ...prev]);
        });

        // 2. Messaggi in arrivo
        channel.listen('ChatEvent', (e) => {
            // e.chat_id deve arrivare dal backend (vedi fix ChatEvent.php)
            
            if (selectedChatId === e.chat_id) {
                // CASO A: La chat è APERTA -> Aggiungo messaggio alla lista messaggi
                setMessages(prev => [...prev, e.message]);
                
                // Aggiorno comunque l'anteprima nella sidebar senza aumentare il contatore
                setChats(prevChats => prevChats.map(chat => {
                    if (chat.id === e.chat_id) {
                        return {
                            ...chat,
                            latest_message: e.message,
                            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        };
                    }
                    return chat;
                }));

                // Opzionale: Qui potresti chiamare axios per segnare subito come letto
            } else {
                // CASO B: La chat è CHIUSA (o ne sto guardando un'altra) -> Aumento UNREAD
                setChats(prevChats => prevChats.map(chat => {
                    if (chat.id === e.chat_id) {
                        return {
                            ...chat,
                            unread: (chat.unread || 0) + 1, // INCREMENTO IL NUMERO ROSSO
                            latest_message: e.message,
                            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        };
                    }
                    return chat;
                }));
            }
        });

        return () => echo.leave('chat.' + user.id);
    }, [user.id, selectedChatId]); // Dipende da selectedChatId per sapere se la chat è aperta

    // --- C. CARICAMENTO LISTA CHAT ---
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await axios.get("/spa/chats");
                setChats(res.data.data);
                setIsLoadingChats(false);
            } catch (error) {
                console.error("Errore chat:", error);
                setIsLoadingChats(false);
            }
        };
        fetchChats();
    }, []);

    // --- D. APERTURA CHAT E CARICAMENTO MESSAGGI ---
    useEffect(() => {
        if (!selectedChatId) return;
        const controller = new AbortController();
        
        // 1. Pulisco i messaggi precedenti
        setMessages([]); 

        // 2. Azzero visivamente il contatore "unread" per questa chat
        setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, unread: 0 } : c));

        // 3. Scarico i messaggi (Il backend aggiornerà last_read_at nel DB automaticamente)
        axios.get(`/spa/chats/${selectedChatId}`, { signal: controller.signal })
            .then(res => setMessages(res.data.data))
            .catch(err => { if (!axios.isCancel(err)) console.error(err); });

        return () => controller.abort();
    }, [selectedChatId]);


    // --- LOGICA DI VISUALIZZAZIONE ---
    const activeChatObj = chats.find((c) => c.id === selectedChatId);
    
    // Trova l'altro utente (safe navigation con || [])
    const otherUser = activeChatObj?.type === 'private' 
        ? (activeChatObj.users || []).find((u) => u.id !== user.id)
        : null;

    // Calcola se è online
    const isOnline = otherUser ? onlineUsers.includes(otherUser.id) : false;

    // Nome Header
    const activeChatName = activeChatObj
        ? activeChatObj.type === 'group'
            ? activeChatObj.name
            : otherUser
                ? `${otherUser.name} ${otherUser.surname}`
                : "Chat"
        : "Chat";

    // --- HANDLERS ---
    const handleChatCreated = (chatObj) => {
        setChats((prev) => {
            if (prev.find((c) => c.id === chatObj.id)) return prev;
            return [chatObj, ...prev];
        });
        setSelectedChatId(chatObj.id);
    };

    function sendMessageChat(updater) {
        setMessages((prev) => {
            const new_messages = updater(prev);
            const lastMsg = new_messages[new_messages.length - 1];

            // Invio al backend
            axios.post('/spa/chats/' + selectedChatId, {
                content: lastMsg.content
            });

            // Aggiorno anteprima sidebar "localmente"
            setChats(prev => prev.map(c => c.id === selectedChatId ? { 
                ...c, 
                latest_message: lastMsg,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            } : c));

            return new_messages;
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex bg-background text-foreground overflow-hidden">
            {/* --- SIDEBAR --- */}
            <div className="w-80 border-r border-border flex flex-col bg-card/50">
                <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.profile_picture_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm truncate max-w-30">
                             {user ? (user.surname ? `${user.name} ${user.surname}` : user.username) : "Messaggi"}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <NewChatDialog onChatCreated={handleChatCreated} />
                        <NewGroupDialog onChatCreated={handleChatCreated} />
                    </div>
                </div>

                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Cerca chat..." className="pl-9 h-9 bg-background/50" />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-2 mt-2">
                    {isLoadingChats ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="flex flex-col gap-1 pb-4">
                            {chats.map((chat) => {
                                // Logica visualizzazione lista
                                let displayName = chat.name;
                                let avatar = chat.avatar;
                                let isChatUserOnline = false;

                                if (chat.type === 'private') {
                                    // SAFETY CHECK: (chat.users || [])
                                    const other = (chat.users || []).find(u => u.id !== user.id);
                                    if (other) {
                                        displayName = `${other.name} ${other.surname}`;
                                        avatar = other.profile_picture_url;
                                        isChatUserOnline = onlineUsers.includes(other.id);
                                    }
                                }

                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChatId(chat.id)}
                                        className={`flex items-center gap-3 p-3 rounded-md text-left transition-all hover:bg-accent/50 ${
                                            selectedChatId === chat.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        }`}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-10 w-10 border border-border/50">
                                                <AvatarImage src={avatar} />
                                                <AvatarFallback>{getAvatarInitials({name: displayName})}</AvatarFallback>
                                            </Avatar>
                                            {/* PALLINO VERDE SIDEBAR (ONLINE STATUS) */}
                                            {isChatUserOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-hidden">
                                            {/* Riga 1: Nome e Orario */}
                                            <div className="flex justify-between items-baseline">
                                                <span className={`text-sm font-medium truncate ${selectedChatId === chat.id ? "text-foreground" : ""}`}>
                                                    {displayName}
                                                </span>
                                                <span className="text-[10px] opacity-70">
                                                     {/* Usa chat.time che arriva formattato dal backend */}
                                                    {chat.time || ''}
                                                </span>
                                            </div>

                                            {/* Riga 2: Messaggio e Badge Non Letti */}
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className={`text-xs truncate opacity-70 flex-1 ${chat.unread > 0 ? 'font-bold text-foreground' : ''}`}>
                                                    {chat.latest_message?.content || "Nessun messaggio"}
                                                </p>
                                                
                                                {/* PALLINO ROSSO (MESSAGGI NON LETTI) */}
                                                {chat.unread > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full ml-2 shadow-sm font-bold animate-in zoom-in">
                                                        {chat.unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* --- AREA CHAT --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-background relative">
                {selectedChatId ? (
                    <>
                        <div className="h-16 px-6 flex items-center justify-between border-b border-border shrink-0 bg-background/95 backdrop-blur">
                            <div>
                                <h2 className="font-semibold text-lg leading-none">{activeChatName}</h2>
                                {/* HEADER ONLINE STATUS (Solo privati) */}
                                {activeChatObj?.type === 'private' && (
                                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <span className={`block w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                                        {isOnline ? "Online" : "Offline"}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {/* SIDECHAT */}
                            <SideChat
                                messages={messages}
                                setMessages={sendMessageChat}
                                enableColor={false}
                                
                                // Prop essenziali
                                chatId={selectedChatId} 
                                isOnline={isOnline}
                                
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