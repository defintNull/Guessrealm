import React, { useState, useEffect, useRef } from 'react';
import SideChat from '@/components/SideChat';

export default function Testchat() {
	const [messages, setMessages] = useState([]);

	const CHAT_ID = 1; // cambia con l'id reale della chat da testare
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		const controller = new AbortController();

		const fetchMessages = async () => {
			try {
				const res = await fetch(`/chats/${CHAT_ID}`, { signal: controller.signal });
				if (!res.ok) return;
				const data = await res.json();
				if (!mountedRef.current) return;
				// normalizza i messaggi per la UI (adatta alle proprietà del backend)
				const mapped = data.map((m) => ({
					id: m.id,
					user: m.user?.username ?? m.user_id ?? 'User',
					text: m.content ?? m.text ?? '',
					meta: { color: 'gray' },
                    updated_at: m.updated_at ?? m.updatedAt ?? null,
				}));
				setMessages(mapped);
			} catch (e) {
				// ignore abort or network errors for simple polling
			}
		};

		// fetch immediately then every 3s
		fetchMessages();
		const id = setInterval(fetchMessages, 3000);

		return () => {
			mountedRef.current = false;
			controller.abort();
			clearInterval(id);
		};
	}, [CHAT_ID]);

	return (
		<div className="h-screen w-screen flex bg-slate-50">
			<div className="flex-1 h-full">
				<SideChat chatId={CHAT_ID} messages={messages} setMessages={setMessages} className="h-full" />
			</div>
		</div>
	);
}
