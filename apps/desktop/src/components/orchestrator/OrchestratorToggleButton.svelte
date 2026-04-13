<script lang="ts">
	import { orchestratorOpen } from '$lib/orchestrator/orchestratorState';

	interface Props {
		onClick: () => void;
	}

	const { onClick }: Props = $props();
	const isOpen = $derived(orchestratorOpen);
</script>

<button
	class="toggle-btn"
	class:active={isOpen}
	onclick={() => {
		orchestratorOpen.set(!isOpen);
		onClick();
	}}
	aria-label="Toggle Orchestrator"
	title="Orchestrator"
>
	<!-- 3x3 grid dots icon -->
	<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
		<circle cx="2" cy="2" r="1.5"/>
		<circle cx="8" cy="2" r="1.5"/>
		<circle cx="14" cy="2" r="1.5"/>
		<circle cx="2" cy="8" r="1.5"/>
		<circle cx="8" cy="8" r="1.5"/>
		<circle cx="14" cy="8" r="1.5"/>
		<circle cx="2" cy="14" r="1.5"/>
		<circle cx="8" cy="14" r="1.5"/>
		<circle cx="14" cy="14" r="1.5"/>
	</svg>
</button>

<style>
	.toggle-btn {
		position: fixed;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10000;
		padding: 4px;
		cursor: pointer;
		background: var(--bg-1);
		border: 1px solid var(--border-2);
		border-radius: 6px;
		transition: background-color var(--transition-fast);
	}
	.toggle-btn:hover {
		background: var(--hover-bg-2);
	}
	.toggle-btn.active {
		background: var(--bg-3);
		border-color: var(--accent-color);
	}
</style>
