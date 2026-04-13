<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import type { ChatMessage } from '$lib/orchestrator/queenChatStore';

	interface Props {
		projectId: string;
	}
	const { projectId }: Props = $props();

	let chatMessages = $state<ChatMessage[]>([]);
	let inputText = $state('');
	let isSending = $state(false);
	let showCopied = $state(false);
	let chatContainer = $state<HTMLDivElement>();

	async function handleSend() {
		const text = inputText.trim();
		if (!text || isSending) return;

		isSending = true;
		inputText = '';

		try {
			const newMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: 'user',
				content: text,
				timestamp: new Date(),
			};
			chatMessages = [...chatMessages, newMessage];

			// TODO: Call GitButler MCP or Claude API here
			await sendMessageToQueen(text);
		} catch (e) {
			console.error('Failed to send:', e);
			} finally {
			isSending = false;
			}
	}

	async function sendMessageToQueen(content: string) {
		try {
			// TODO: Replace with actual GitButler MCP call or Claude API
			console.log('[Queen Trinity]', content);

			// Placeholder response for demo
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Add a demo response
			const response: ChatMessage = {
				id: crypto.randomUUID(),
				role: 'queen',
				content: `Echo: ${content}`,
				timestamp: new Date(),
			};
			chatMessages = [...chatMessages, response];
		} catch (e) {
			console.error('Queen Trinity error:', e);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			showCopied = true;
			setTimeout(() => showCopied = false, 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	function formatMessage(content: string): string {
		return content
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\n/g, '<br>');
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	onMount(() => {
		scrollToBottom();
	});
</script>

<div class="queen-chat">
	<div class="queen-chat__messages" bind:this={chatContainer}>
		{#each chatMessages as msg}
			<div class="message message--{msg.role}" style="align-items: {msg.role === 'user' ? 'flex-end' : 'flex-start'}">
				{#if msg.role === 'user'}
					<div class="message-bubble message-bubble--user">
						{msg.content}
					</div>
				{:else}
					<div class="message-bubble message-bubble--queen">
						<div class="message-content">
							{@html formatMessage(msg.content)}
						</div>
						<button
							class="copy-button"
							onclick={() => copyToClipboard(msg.content)}
							title="Copy to clipboard"
						>
							{#if showCopied && chatMessages[chatMessages.length - 1] === msg}
								Copied!
							{:else}
								Copy
							{/if}
						</button>
					</div>
				{/if}
				<div class="message-time">
					{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
				</div>
			</div>
		{/each}
		{#if isSending}
			<div class="message message--queen">
				<div class="message-bubble message-bubble--queen">
					<span class="loading-dots">
						<span>.</span><span>.</span>
					</span>
				</div>
			</div>
		{/if}
	</div>

	<div class="queen-chat__input">
		<input
			type="text"
			bind:value={inputText}
			onkeydown={handleKeydown}
			placeholder="Ask Queen Trinity..."
			disabled={isSending}
			class="queen-chat__input-field"
		/>
		<button
			onclick={handleSend}
			disabled={!inputText.trim() || isSending}
			class="queen-chat__send-button"
		>
			Send
		</button>
	</div>
</div>

<style>
	.queen-chat {
		display: flex;
		flex-direction: column;
		height: 400px;
		border-bottom: 1px solid var(--border-2);
	}

	.queen-chat__messages {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
		display: flex;
		flex-direction: column;
	}

	.message {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.message--user {
		align-items: flex-end;
	}

	.message--queen {
		align-items: flex-start;
	}

	.message-bubble {
		max-width: 80%;
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 12px;
		line-height: 1.4;
	}

	.message-bubble--user {
		background: var(--color-purple);
		color: white;
	}

	.message-bubble--queen {
		background: var(--bg-2);
		color: var(--text-1);
	}

	.message-content code {
		background: var(--bg-3);
		padding: 2px 4px;
		border-radius: 4px;
		font-family: var(--font-code);
		font-size: 11px;
	}

	.copy-button {
		font-size: 9px;
		padding: 2px 6px;
		background: var(--bg-3);
		border: none;
		border-radius: 4px;
		color: var(--text-2);
		cursor: pointer;
	}

	.copy-button:hover {
		opacity: 1;
	}

	.copy-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.message-time {
		font-size: 9px;
		color: var(--text-3);
		margin-top: 2px;
	}

	.loading-dots span {
		animation: blink 1.4s infinite;
	}

	@keyframes blink {
		0%, 80%, 100% { opacity: 0.2; }
		40% { opacity: 1; }
	}

	.queen-chat__input {
		display: flex;
		gap: 8px;
		padding: 12px;
	}

	.queen-chat__input-field {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid var(--border-2);
		border-radius: 6px;
		background: var(--bg-1);
		color: var(--text-1);
		font-size: 12px;
	}

	.queen-chat__input-field:focus {
		outline: 2px solid var(--color-purple);
	}

	.queen-chat__send-button {
		padding: 8px 16px;
		background: var(--color-purple);
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 12px;
		cursor: pointer;
	}

	.queen-chat__send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
