<script lang="ts">
	import { Markdown } from "@gitbutler/ui";

	interface Props {
		content?: string;
	}

	let { content }: Props = $props();
</script>

{#if content}
	<div class="message-assistant text-13 text-body">
		<Markdown {content} />
	</div>
{/if}

<style lang="postcss">
	.message-assistant {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: var(--message-max-width);
		padding: 8px 0;
		overflow: hidden;
		gap: 10px;
		text-wrap: wrap;
		word-break: break-word;
		position: relative;
	}
	.message-assistant__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
	}
	.message-assistant__actions-copy,
	.message-assistant__feedback {
		display: flex;
		gap: 4px;
	}
	:global(.message-assistant .markdown > *) {
		/** With padding block quote background can still be full width. */
		padding-right: 32px;
	}
	.message-assistant__header {
		display: flex;
		justify-content: flex-start;
		margin-bottom: 4px;
		min-height: 16px;
	}
	.message-assistant__timestamp {
		font-size: 11px;
		color: var(--text-3);
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	.message-assistant__timestamp.visible {
		opacity: 1;
	}
	.message-assistant__toggle {
		background: none;
		border: none;
		color: var(--text-2);
		font-size: 12px;
		cursor: pointer;
		padding: 4px 0;
		text-align: left;
		&:hover {
			color: var(--text-1);
			text-decoration: underline;
		}
	}
	.message-assistant__actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 6px;
		gap: 4px;
		flex-wrap: wrap;
	}
	.message-assistant__actions-copy {
		display: flex;
		position: relative;
	}
	.copy-options {
		position: absolute;
		top: 100%;
		right: 0;
		background: var(--bg-1);
		border: 1px solid var(--border-2);
		border-radius: var(--radius-s);
		box-shadow: var(--shadow-md);
		z-index: 100;
		min-width: 150px;
	}
	.copy-option {
		display: block;
		width: 100%;
		padding: 8px 12px;
		background: none;
		border: none;
		text-align: left;
		font-size: 12px;
		cursor: pointer;
		color: var(--text-1);
		&:hover {
			background: var(--hover-bg-2);
		}
		&:first-child {
			border-radius: var(--radius-s) var(--radius-s) 0 0;
		}
		&:last-child {
			border-radius: 0 0 var(--radius-s) var(--radius-s);
		}
	}
	.message-assistant__feedback {
		display: flex;
		gap: 2px;
	}
</style>
