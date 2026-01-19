import { useAuth } from "@/context/AuthProvider";
import ColoredText, { TextColor } from "./ColoredText";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { useState, useEffect, useRef } from "react";
import { SendIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function SideChat({
    messages,
    setMessages,
    chatId = null,
    isOnline = false,
    typingUserUsername = null,
    handleTyping = () => {},
    enableColor = true,
    ...props
}) {
    const { user } = useAuth();
    const scrollRef = useRef(null);
    const [inputValue, setInputValue] = useState("");
    const typingTimeoutRef = useRef(null);

    const sendMessage = async () => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;

        setInputValue("");

        // Aggiungiamo il messaggio localmente
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
        handleTyping();
    };

    // Auto-scroll in basso
    useEffect(() => {
        const viewport = scrollRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]"
        );
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages]);

    return (
        <Card {...props} className="h-full flex flex-col pb-2 overflow-hidden border-none shadow-none rounded-none">
            <ScrollArea
                ref={scrollRef}
                className="flex-1 h-0 px-4 overflow-x-hidden [&_[data-radix-scroll-area-viewport]>div]:min-w-0 [&_[data-radix-scroll-area-viewport]>div]:max-w-full"
            >
                {messages.map((msg, index) => {
                    const isSameUser = index > 0 && messages[index - 1].user.id === msg.user.id;

                    return (
                        <div key={msg.id} className={`flex gap-3 ${isSameUser ? "mt-0.5" : "mt-4"}`}>
                            <div className="w-8 relative">
                                {!isSameUser && (
                                    <>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={msg?.user?.avatar} />
                                            <AvatarFallback>{msg?.user?.username?.[0] || "?"}</AvatarFallback>
                                        </Avatar>
                                    </>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col">
                                {!isSameUser && (
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="font-bold text-indigo-500 uppercase">
                                            {msg?.user?.username || "System"}
                                        </span>
                                        <span className="text-muted-foreground">{msg?.time || ""}</span>
                                    </div>
                                )}
                                <ColoredText
                                    color={msg?.color || TextColor.GRAY}
                                    className="w-full wrap-break-word whitespace-pre-wrap"
                                >
                                    {msg?.content || ""}
                                </ColoredText>
                            </div>
                        </div>
                    );
                })}

                {/* VISUALIZZAZIONE "STA SCRIVENDO" */}
                {typingUserUsername && (
                    <div className="flex gap-3 mt-2 ml-1 text-xs text-muted-foreground italic animate-pulse">
                        {typingUserUsername} sta scrivendo...
                    </div>
                )}
            </ScrollArea>

            <div className="px-1 flex items-end gap-2 pt-2 border-t mt-1">
                <Textarea
                    className="resize-none flex-1 min-h-10 max-h-25"
                    onKeyDown={textareaSubmit}
                    onChange={handleInputChange}
                    value={inputValue}
                    placeholder="Scrivi un messaggio..."
                />
                <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    className="ml-2 h-10 w-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                    <SendIcon className="size-4" />
                </button>
            </div>
        </Card>
    );
}
