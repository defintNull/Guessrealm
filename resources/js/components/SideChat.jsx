import { useAuth } from "@/context/AuthProvider";
import ColoredText, { TextColor } from "./ColoredText";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { useState, useEffect, useRef } from "react";

export default function SideChat({messages, setMessages, ...props}) {
    const { user } = useAuth();
    const scrollRef = useRef(null);

    const textareaSubmit = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        const value = e.target.value.trim();
        if (!value) return;

        setMessages((prev) => [
            ...prev,
            {
                id: prev.length ? prev[prev.length - 1].id + 1 : 1,
                color: TextColor.GREEN,
                text: "[" + user?.username + "]: " + value,
            },
        ]);

        e.target.value = "";
        }
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
            {messages.map((el) => (
                <ColoredText color={el.color} key={el.id} className="py-0.5">
                    {el.text}
                </ColoredText>
            ))}
        </ScrollArea>

        <div className="px-1">
            <Textarea
            className="resize-none"
            onKeyDown={textareaSubmit}
            placeholder="Scrivi un messaggio..."
            />
        </div>
        </Card>
    );
}
