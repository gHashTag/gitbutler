import { writable, derived, get } from 'svelte/store';
import { homeDir, join } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

export interface ChatMessage {
	id: string;
	role: 'user' | 'queen';
	content: string;
	timestamp: Date;
}

export const chatMessages = writable<ChatMessage[]>([]);
export const isSending = writable(false);

export function addUserMessage(content: string) {
	chatMessages.update(msgs => [
		...msgs,
		{
			id: crypto.randomUUID(),
			role: 'user',
			content,
			timestamp: new Date(),
		},
	]);
}

export function addQueenResponse(content: string) {
	chatMessages.update(msgs => [
		...msgs,
		{
			id: crypto.randomUUID(),
			role: 'queen',
			content,
			timestamp: new Date(),
		},
	]);
}

export function clearChat() {
	chatMessages.set([]);
}

async function getApiKey(): Promise<string | null> {
	// Try localStorage first
	const localStorageKey = localStorage.getItem('zai_api_key');
	if (localStorageKey && localStorageKey.startsWith('sk-')) {
		return localStorageKey;
	}

	// Fallback to ~/.claude/.env via Tauri
	try {
		const home = await homeDir();
		const envPath = await join(home, '.claude', '.env');
		const envContent = await readTextFile(envPath);

		// Parse ZAI_KEY_1 or first ZAI_KEY_N from env
		const match = envContent.match(/ZAI_KEY_1=([^\s\n]+)/);
		if (match && match[1]) {
			localStorage.setItem('zai_api_key', match[1]);
			return match[1];
		}
	} catch (e) {
		console.warn('Could not read ~/.claude/.env:', e);
	}

	return null;
}

export async function sendMessage(text: string): Promise<void> {
	const key = await getApiKey();

	if (!key) {
		// Check if user is providing API key
		if (text.trim().startsWith('sk-')) {
			localStorage.setItem('zai_api_key', text.trim());
			addQueenResponse('API ключ сохранён. Можешь писать!');
			return;
		}
		addQueenResponse('Введи API ключ z.ai: напиши его следующим сообщением и я запомню');
		return;
	}

	isSending.set(true);
	addUserMessage(text);

	try {
		const msgs = get(chatMessages);
		const conversationHistory = msgs.slice(-10).map(m => ({
			role: m.role === 'queen' ? 'assistant' : 'user',
			content: m.content
		}));

		const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + key,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'glm-4-flash',
				messages: [
					{ role: 'system', content: 'Ты Queen Trinity — AI оркестратор Trinity S³AI (t27). Управляешь 27 агентами, 32 rings, PHI LOOP, GitButler. Отвечай кратко и технично на языке пользователя. φ²+φ⁻²=3|TRINITY' },
					...conversationHistory
				],
				max_tokens: 512
			})
		});

		if (!res.ok) {
			throw new Error(`API error: ${res.status}`);
		}

		const data = await res.json();
		const content = data.choices?.[0]?.message?.content || 'Нет ответа';

		addQueenResponse(content);
	} catch (e) {
		addQueenResponse(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
	} finally {
		isSending.set(false);
	}
}
