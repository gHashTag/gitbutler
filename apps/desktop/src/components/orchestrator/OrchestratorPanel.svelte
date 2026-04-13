<script lang="ts">
	import { slide } from 'svelte/transition';
	import QueenTrinityChat from '$components/orchestrator/QueenTrinityChat.svelte';
	import OrchestratorRingMap from '$components/orchestrator/OrchestratorRingMap.svelte';
	import OrchestratorActivityFeed from '$components/orchestrator/OrchestratorActivityFeed.svelte';
	import RepoFleet from '$components/orchestrator/RepoFleet.svelte';

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

<style>
	.orchestrator-panel {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		width: 320px;
		z-index: 9999;
		background: var(--clr-bg-1, #1a1a1a);
		border-left: 1px solid var(--clr-border-2, #333);
		box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		transform: translateX(100%);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}

	.orchestrator-panel.open {
		transform: translateX(0);
	}
</style>

{#if open}
	<aside
		class="orchestrator-panel"
		class:open
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
