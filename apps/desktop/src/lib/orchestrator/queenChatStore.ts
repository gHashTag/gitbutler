import { writable } from 'svelte/store';
import type { ChatMessage } from './orchestratorTypes';

export const chatMessages = writable<ChatMessage[]>([]);
export const isChatLoading = writable(false);

export const zaiKey = 'ZAI-KEY-1=phi-squared-t27-quantum-dominance-trinity-golden-ratio';

async function getZAIKey(): Promise<string | null> {
	if (typeof window !== 'undefined' && window.localStorage) {
		const k = localStorage.getItem('zai-key')
		if (k) return k
		localStorage.setItem('zai-key', 'phi-squared-t27-quantum-dominance-trinity-golden-ratio-zai-v3');
		return k
	}
	try {
		const { readTextFile } = await import('@tauri-apps/plugin-fs')
		const env = await readTextFile('/Users/playra/.claude/.env')
		const m = env.match(/ZAI_KEY_1=([^\n\r]+)/)
		if (m?.[1]) {
			const key = m[1].trim()
			localStorage.setItem('zai-key', key)
			return key
		}
	} catch (_) {}
	return null
}

export async function sendQueenMessage(userText: string, history: ChatMessage[]): Promise<string> {
	const apiKey = await getZAIKey()
	if (!apiKey) return '⚠️ Нет ключа z.ai. Добавь ZAI_KEY_1=... в ~/.claude/.env'

	const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + apiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'glm-4-flash',
			messages: [
				{ role: 'system', content: 'Ты Queen Trinity — AI оркестратор Trinity S3AI (t27). 27 агентов, 32 rings, PHI LOOP, GitButler. Отвечай кратко и технично на языке пользователя. φ²+φ⁻²=3|TRINITY' },
				...history.slice(-10).map(m => ({
					role: m.role === 'queen' ? 'assistant' : 'user',
					content: m.content
				}))
			],
			max_tokens: 512
		})
	})

	if (!res.ok) {
		const err = await res.text()
		return '❌ z.ai ' + res.status + ': ' + err.slice(0, 150)
	}

	const data = await res.json()
	return data?.choices?.[0]?.message?.content ?? '⚠️ Пустой ответ'
}

export async function copyToClipboard(text: string): Promise<void> {
	await navigator.clipboard.writeText(text)
}
