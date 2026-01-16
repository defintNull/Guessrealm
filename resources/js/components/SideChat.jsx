import { useAuth } from "@/context/AuthProvider";
import ColoredText, { TextColor } from "./ColoredText";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { SendIcon } from "lucide-react";
import { toast } from "sonner";

export default function SideChat({chatId = null, messages, setMessages, ...props}) {
    const { user } = useAuth();
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        // Ensure CSRF cookie is present for web POST routes (Sanctum)
        axios.get('/sanctum/csrf-cookie').catch(() => {});
    }, []);

    const sendMessage = async () => {
        const el = inputRef.current;
        const value = (el?.value ?? inputValue)?.trim();
        if (!value) return;

        if (el) el.value = "";
        setInputValue("");

        try {
            const url = chatId ? `/chats/${chatId}` : '/chats';
            const payload = chatId ? { content: value } : { chat_id: null, content: value };
            const res = await axios.post(url, payload);
            const m = res.data;
            const mapped = {
                id: m.id,
                text: m.content ?? m.text ?? value,
            };
            setMessages((prev) => [...prev, mapped]);
        } catch (error) {
            console.error('Failed to send message', error);
            toast.error('Errore invio messaggio');
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
        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
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
            {messages.map((el) => (
                <div key={el.id} className="py-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-0.5">
                        <span className="font-medium">{el.user ?? el.username ?? (el.text?.match(/^\[(.+?)\]:/)?.[1]) ?? 'User'}</span>
                        {el.updated_at ? (
                            <span className="ml-2 text-xs text-muted-foreground">{new Date(el.updated_at).toLocaleString()}</span>
                        ) : null}
                    </div>
                    <ColoredText color={el.color} className="py-0.5">
                        {el.text}
                    </ColoredText>
                </div>
            ))}
        </ScrollArea>

        <div className="px-1 flex items-end gap-2">
            <Textarea
                ref={inputRef}
                className="resize-none flex-1"
                onKeyDown={textareaSubmit}
                onChange={handleInputChange}
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
