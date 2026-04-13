<script lang="ts">
  import { orchestratorOpen } from '$lib/orchestrator/orchestratorState';

  export let isOpen = false;
  export let onClick = () => {};
</script>

<button
	class="toggle-btn"
	class:active={isOpen}
	onclick={() => {
		isOpen = !isOpen;
		onClick();
	}}
	aria-label="Toggle Orchestrator"
	title="Orchestrator"
>
	<!-- Icon: 3x3 grid dots icon -->
	<circle cx="2" cy="2" r="1.5" fill="currentColor"/>
	<circle cx="8" cy="2" r="1.5" fill="currentColor"/>
	<circle cx="14" cy="2" r="1.5" fill="currentColor"/>
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
