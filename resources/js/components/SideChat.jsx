import { useAuth } from "@/context/AuthProvider";
import ColoredText, { TextColor } from "./ColoredText";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function SideChat({ chatId, messages, setMessages, ...props }) {
    const { user } = useAuth();
    const scrollRef = useRef(null);
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        // Ensure CSRF cookie is present for web POST routes (Sanctum)
        axios.get("/sanctum/csrf-cookie").catch(() => {});
    }, []);

    const sendMessage = async () => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue || isSending) return;

        setIsSending(true);
        setInputValue(""); // Puliamo subito l'input per dare feedback all'utente

        try {
            // Usiamo il Route Model Binding definito nel backend
            const res = await axios.post(`/chats/${chatId}`, {
                content: trimmedValue,
            });

            // Il server ora restituisce la MessageResource!
            const newMessage = res.data.data; // Nota: Laravel Resources avvolgono in 'data'

            setMessages((prev) => [...prev, newMessage]);
        } catch (error) {
            // Se fallisce, potresti voler rimettere il testo nell'input o avvisare
            setInputValue(trimmedValue);
            const errorMsg =
                error.response?.status === 403
                    ? "Non hai i permessi per scrivere in questa chat"
                    : "Errore nell'invio";
            toast.error(errorMsg);
        } finally {
            setIsSending(false);
        }
    };

    const textareaSubmit = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    useEffect(() => {
        const viewport = scrollRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]"
        );
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages]);

    return (
        <Card {...props} className="h-full flex flex-col pb-2 overflow-hidden">
            <CardHeader>
                <CardTitle>Chat</CardTitle>
            </CardHeader>

            <ScrollArea ref={scrollRef} className="flex-1 h-0 px-4">
                {console.log(messages)}
                {messages.map((msg, index) => {
                    // Verifichiamo se il mittente è lo stesso del messaggio precedente
                    const isSameUser =
                        index > 0 &&
                        messages[index - 1].user.id === msg.user.id;

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${
                                isSameUser ? "mt-0.5" : "mt-4"
                            }`}
                        >
                            {/* L'Avatar lo mostriamo solo se l'utente NON è lo stesso del messaggio precedente */}
                            <div className="w-8">
                                {!isSameUser && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={msg.user.avatar} />
                                        <AvatarFallback>
                                            {msg.user.username[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col">
                                {/* Anche il nome lo mostriamo solo se è un "nuovo" blocco di messaggi */}
                                {!isSameUser && (
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="font-bold text-indigo-500 uppercase">
                                            {msg.user.username}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {msg.time}
                                        </span>
                                    </div>
                                )}

                                <ColoredText
                                    color={
                                        msg.user.id === user?.id
                                            ? "GREEN"
                                            : "DEFAULT"
                                    }
                                >
                                    {msg.content}
                                </ColoredText>
                            </div>
                        </div>
                    );
                })}
            </ScrollArea>

            <div className="px-1 flex items-end gap-2">
                <Textarea
                    //ref={inputRef}
                    className="resize-none flex-1"
                    onKeyDown={textareaSubmit}
                    onChange={handleInputChange}
                    value={inputValue}
                    placeholder="Scrivi un messaggio..."
                />
                <button
                    type="button"
                    onClick={sendMessage}
                    aria-label="Invia"
                    disabled={!inputValue.trim()}
                    className="ml-2 h-10 w-10 rounded-full flex items-center justify-center bg-white dark:bg-black text-black dark:text-white hover:opacity-90 disabled:opacity-50 border border-gray-200 dark:border-gray-700"
                >
                    <SendIcon className="size-4" />
                </button>
            </div>
        </Card>
    );
}
