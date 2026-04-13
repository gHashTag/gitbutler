<script lang="ts">
	import { orchestratorOpen } from '$lib/orchestrator/orchestratorState';
</script>

<button
	class="orchestrator-toggle"
	class:active={$orchestratorOpen}
	onclick={() => orchestratorOpen.update((open) => !open)}
	aria-label="Toggle Orchestrator Panel"
	title="Orchestrator"
>
	<!-- Icon: grid / agent network -->
	<svg width="16" height="16" viewBox="0 0 16 16">
		<!-- 3x3 grid dots icon -->
		<circle cx="2" cy="2" r="1.5" fill="currentColor"/>
		<circle cx="8" cy="2" r="1.5" fill="currentColor"/>
		<circle cx="14" cy="2" r="1.5" fill="currentColor"/>
	</svg>
</button>

<style>
	.orchestrator-toggle {
		padding: 4px;
		margin-right: 8px;
		cursor: pointer;
		background: var(--bg-1);
		border: 1px solid var(--border-2);
		border-radius: 6px;
		transition: background-color var(--transition-fast);
	}
	.orchestrator-toggle:hover {
		background: var(--hover-bg-2);
	}
	.orchestrator-toggle.active {
		background: var(--bg-3);
		border-color: var(--accent-color);
	}
</style>
