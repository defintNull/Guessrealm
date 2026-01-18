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

export default function SideChat({
    messages,
    setMessages,
    enableColor = true,
    ...props
}) {
    const { user } = useAuth();
    const scrollRef = useRef(null);
    const [inputValue, setInputValue] = useState("");

    const sendMessage = async () => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;

        setInputValue("");

        setMessages((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                color: enableColor ? TextColor.GREEN : TextColor.GRAY,
                content: trimmedValue,
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.profile_picture_url,
                },
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            },
        ]);
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
                                        <AvatarImage src={msg?.user?.avatar} />
                                        <AvatarFallback>
                                            {msg?.user?.username[0] || "S"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col">
                                {/* Anche il nome lo mostriamo solo se è un "nuovo" blocco di messaggi */}
                                {!isSameUser && (
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="font-bold text-indigo-500 uppercase">
                                            {msg?.user?.username || "System"}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {msg?.time || ""}
                                        </span>
                                    </div>
                                )}

                                <ColoredText
                                    color={msg?.color || TextColor.GRAY}
                                >
                                    {msg?.content || ""}
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
                    className="ml-2 h-10 w-10 hover:cursor-pointer rounded-full flex items-center justify-center bg-white dark:bg-black text-black dark:text-white hover:opacity-90 disabled:opacity-50 border border-gray-200 dark:border-gray-700"
                >
                    <SendIcon className="size-4" />
                </button>
            </div>
        </Card>
    );
}
