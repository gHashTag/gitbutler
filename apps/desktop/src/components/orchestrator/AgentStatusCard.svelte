<script lang="ts">
	import type { AgentStatus, AgentState } from '$lib/orchestrator/agentStore';

	interface Props {
		agent: AgentStatus;
	}
	const { agent }: Props = $props();

	const STATE_COLORS: Record<AgentState, string> = {
		thinking: '#f59e0b', // amber
		working: '#3b82f6', // blue
		waiting: '#6b7280', // gray
		done: '#10b981', // green
		error: '#ef4444', // red
	};

	const STATE_ICONS: Record<AgentState, string> = {
		thinking: '●',
		working: '▶',
		waiting: '○',
		done: '✓',
		error: '✗',
	};
</script>

<div class="agent-card">
	<div
		class="agent-card__status-dot"
		style="background: {STATE_COLORS[agent.state]}"
	></div>
	<div class="agent-card__info">
		<div class="agent-card__header">
			<span class="agent-letter">Agent {agent.id}</span>
			<span class="agent-name">{agent.name}</span>
		</div>
		{#if agent.branch}
			<div class="agent-branch">{agent.branch}</div>
		{/if}
		{#if agent.lastAction}
			<div class="agent-action">{agent.lastAction}</div>
		{/if}
	</div>
	<span class="state-icon">{STATE_ICONS[agent.state]}</span>
</div>

<style lang="postcss">
	.agent-card {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--bg-1);
		border-radius: 6px;
		margin-bottom: 4px;
	}
	.agent-card__status-dot {
		flex-shrink: 0;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.agent-card__info {
		flex: 1;
		min-width: 0;
	}
	.agent-card__header {
		display: flex;
		gap: 6px;
		font-size: 12px;
		font-weight: 500;
	}
	.agent-letter {
		color: var(--text-2);
		font-size: 11px;
	}
	.agent-name {
		color: var(--text-1);
	}
	.agent-branch {
		font-size: 10px;
		color: var(--text-3);
		font-family: var(--font-code);
	}
	.agent-action {
		font-size: 10px;
		color: var(--text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.state-icon {
		flex-shrink: 0;
		font-size: 12px;
	}
</style>
