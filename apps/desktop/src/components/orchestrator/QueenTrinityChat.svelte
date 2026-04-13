<script lang="ts">
	import { chatMessages, isChatLoading, sendQueenMessage, copyToClipboard } from '$lib/orchestrator/queenChatStore';
	import type { ChatMessage } from '$lib/orchestrator/orchestratorTypes';

	interface Props {
		projectId: string;
	}

	const { projectId }: Props = $props();

	let messageText = $state('');

	async function sendMessage() {
		if (!messageText.trim()) return;
		const currentMessages = $chatMessages;
		const response = await sendQueenMessage(messageText, currentMessages);
		messageText = '';
	}
</script>

<div class="queen-chat">
	<div class="chat-messages">
		{#each $chatMessages as msg (msg.id)}
			<div class="chat-message" class:user={msg.role === 'user'} class:queen={msg.role === 'queen'}>
				<div class="message-content">
					{#if msg.role === 'queen'}
						<span class="role-badge">👑 Queen</span>
					{:else}
						<span class="role-badge">👤 You</span>
					{/if}
					<p class="message-text">{msg.content}</p>
				</div>
				<span class="message-time">{msg.timestamp}</span>
			</div>
		{/each}
		{#if $isChatLoading}
			<div class="chat-message queen">
				<div class="message-content">
					<span class="role-badge">👑 Queen</span>
					<p class="message-text loading">Thinking...</p>
				</div>
			</div>
		{/if}
	</div>

	<form class="chat-input" onsubmit={async (e) => { e.preventDefault(); sendMessage(); }}>
		<input
			type="text"
			bind:value={messageText}
			placeholder="Ask Queen Trinity..."
			disabled={$isChatLoading}
		/>
		<button type="submit" disabled={$isChatLoading || !messageText.trim()}>
			Send
		</button>
	</form>
</div>

<style>
	.queen-chat {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 8px;
	}
	.chat-messages {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
	}
	.chat-message {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px;
		border-radius: 8px;
		max-width: 85%;
	}
	.chat-message.user {
		align-self: flex-end;
		background: var(--accent-color-dimmed);
	}
	.chat-message.queen {
		align-self: flex-start;
		background: var(--bg-2);
	}
	.message-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.role-badge {
		font-size: 10px;
		opacity: 0.8;
	}
	.message-text {
		margin: 0;
		font-size: 13px;
		line-height: 1.4;
	}
	.message-text.loading {
		opacity: 0.6;
	}
	.message-time {
		font-size: 10px;
		opacity: 0.5;
	}
	.chat-input {
		display: flex;
		gap: 8px;
		padding: 8px;
		border-top: 1px solid var(--border-2);
	}
	.chat-input input {
		flex: 1;
		padding: 8px;
		border-radius: 4px;
		border: 1px solid var(--border-2);
		background: var(--bg-1);
		color: var(--text-1);
	}
	.chat-input button {
		padding: 8px 16px;
		border-radius: 4px;
		border: none;
		background: var(--accent-color);
		color: white;
		cursor: pointer;
	}
	.chat-input button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
