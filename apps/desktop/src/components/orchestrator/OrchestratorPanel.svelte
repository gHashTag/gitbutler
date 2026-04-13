<script lang="ts">
	import { slide } from 'svelte/transition';
	import QueenTrinityChat from './QueenTrinityChat.svelte';
	import OrchestratorRingMap from './OrchestratorRingMap.svelte';
	import OrchestratorActivityFeed from './OrchestratorActivityFeed.svelte';
	import RepoFleet from './RepoFleet.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		projectId: string;
	}

	const { open, onClose, projectId }: Props = $props();

	let sections = $state({
		agents: true,
		repos: true,
		ringMap: false,
		activity: true,
	});
</script>

{#if open}
	<aside
		class="orchestrator-panel"
		transition:slide={{ axis: 'x', duration: 200 }}
	>
		<header class="orchestrator-panel__header">
			<span class="text-14 text-semibold">Orchestrator</span>
			<button onclick={onClose} aria-label="Close orchestrator">✕</button>
		</header>

		<section class="orchestrator-section">
			<button class="section-toggle" onclick={() => sections.agents = !sections.agents}>
				<span class="section-icon">👑</span>
				Queen Trinity <span class="agent-count-badge">Chat</span>
			</button>
			{#if sections.agents}
				<QueenTrinityChat {projectId} />
			{/if}
		</section>

		<section class="orchestrator-section">
			<button class="section-toggle" onclick={() => sections.repos = !sections.repos}>
				Repositories
			</button>
			{#if sections.repos}
				<RepoFleet {projectId} />
			{/if}
		</section>

		<section class="orchestrator-section">
			<button class="section-toggle" onclick={() => sections.ringMap = !sections.ringMap}>
				Ring Map (0–31)
			</button>
			{#if sections.ringMap}
				<OrchestratorRingMap />
			{/if}
		</section>

		<section class="orchestrator-section">
			<button class="section-toggle" onclick={() => sections.activity = !sections.activity}>
				Activity
			</button>
			{#if sections.activity}
				<OrchestratorActivityFeed {projectId} />
			{/if}
		</section>
	</aside>
{/if}

<style lang="postcss">
	.orchestrator-panel {
		position: fixed;
		right: 0;
		top: 0;
		bottom: 0;
		width: 320px;
		background: var(--bg-1);
		border-left: 1px solid var(--border-2);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		z-index: 100;
	}
	.orchestrator-panel__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-2);
		position: sticky;
		top: 0;
		background: var(--bg-1);
	}
	.orchestrator-section {
		border-bottom: 1px solid var(--border-2);
	}
	.section-toggle {
		width: 100%;
		text-align: left;
		padding: 10px 16px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-2);
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.agent-count-badge {
		margin-left: auto;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--bg-3);
		color: var(--text-1);
		font-weight: 500;
	}
</style>
