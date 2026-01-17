import { useState, useEffect } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Loader2, UserPlus } from "lucide-react";

export default function NewChatDialog({ onChatCreated }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Effetto per la ricerca (Debounce semplice)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (search.length < 2) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                // CORREZIONE 1: Aggiunto /spa/ all'URL
                const res = await axios.get(`/spa/users?search=${search}`);
                
                // CORREZIONE 2: Controllo anti-crash. Se non è un array, usiamo array vuoto.
                setUsers(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("Errore ricerca utenti:", error);
                setUsers([]); 
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    // Creazione della Chat
    const startChat = async (userId) => {
        try {
            // CORREZIONE 3: Assicuriamoci che lo slash iniziale ci sia: /spa/chats
            const res = await axios.post("/spa/chats", {
                user_id: userId,
                type: "private",
            });

            if (onChatCreated) {
                onChatCreated(res.data.data);
            }

            setOpen(false);
            setSearch("");
            setUsers([]); // Puliamo la lista dopo la selezione
        } catch (error) {
            console.error("Errore creazione chat", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Nuova Chat">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuova Chat</DialogTitle>
                </DialogHeader>

                <div className="gap-4 py-4">
                    <Input
                        placeholder="Cerca nome o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="col-span-3"
                    />
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                    {loading && (
                        <div className="flex justify-center p-2">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!loading && users.length === 0 && search.length > 1 && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                            Nessun utente trovato.
                        </p>
                    )}

                    {users.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => startChat(user.id)}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        >
                            <Avatar>
                                <AvatarImage src={user.profile_picture_url} />
                                <AvatarFallback>
                                    {user.name ? user.name.substring(0, 2).toUpperCase() : "??"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium leading-none truncate">
                                    {user.name} {user.surname}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                            <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}