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
import { Users, Loader2, Check, X } from "lucide-react";

// NON serve più importare Badge

export default function NewGroupDialog({ onChatCreated }) {
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Ricerca Utenti
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (search.length < 2) {
                setUsers([]);
                return;
            }
            setLoading(true);
            try {
                // Ricorda il prefisso /spa/ che abbiamo aggiunto
                const res = await axios.get(`/spa/users?search=${search}`);
                setUsers(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    // Toggle selezione
    const toggleUser = (user) => {
        if (selectedUsers.find((u) => u.id === user.id)) {
            setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
        } else {
            setSelectedUsers((prev) => [...prev, user]);
        }
    };

    // Creazione Gruppo
    const createGroup = async () => {
        if (!groupName || selectedUsers.length === 0) return;

        try {
            const res = await axios.post("/spa/chats", {
                type: "group",
                name: groupName,
                users: selectedUsers.map((u) => u.id),
            });

            if (onChatCreated) onChatCreated(res.data.data);

            setOpen(false);
            setGroupName("");
            setSelectedUsers([]);
            setSearch("");
        } catch (error) {
            console.error("Errore creazione gruppo", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Nuovo Gruppo"
                >
                    <Users className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crea un Gruppo</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <Input
                        placeholder="Nome del gruppo (es. Calcetto)"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />

                    {/* Area Utenti Selezionati (Sostituito Badge con div Tailwind) */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium border"
                                >
                                    {u.name}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                                        onClick={() => toggleUser(u)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <Input
                        placeholder="Cerca persone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                        {loading && (
                            <div className="flex justify-center">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        )}

                        {users.map((user) => {
                            const isSelected = selectedUsers.find(
                                (u) => u.id === user.id,
                            );
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUser(user)}
                                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-accent" : "hover:bg-accent/50"}`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={user.profile_picture_url}
                                        />
                                        <AvatarFallback>
                                            {user.name ? user.name[0] : "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {user.name} {user.surname}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-green-500" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <Button
                        onClick={createGroup}
                        disabled={!groupName || selectedUsers.length === 0}
                    >
                        Crea Gruppo
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
