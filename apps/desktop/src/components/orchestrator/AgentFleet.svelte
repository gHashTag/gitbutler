<script lang="ts">
	import { agentsStore } from '$lib/orchestrator/agentStore';
	import type { AgentStatus } from '$lib/orchestrator/agentStore';
	import AgentStatusCard from './AgentStatusCard.svelte';

	interface Props {
		projectId: string;
	}
	const { projectId }: Props = $props();
</script>

<div class="agent-fleet">
	{#each $agentsStore as agent}
		<AgentStatusCard {agent} />
	{/each}
</div>

<style lang="postcss">
	.agent-fleet {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
