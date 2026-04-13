<script lang="ts">
	import type { RingStatus } from '$lib/orchestrator/orchestratorTypes';

	const rings: RingStatus[] = Array.from({ length: 32 }, (_, i) => ({
		id: i,
		status: i < 5 ? 'complete' : i < 12 ? 'in-progress' : 'pending',
		label: `Ring ${i}`,
		progress: i < 5 ? 100 : i < 12 ? Math.floor((i - 4) * 12) : 0,
	}));
</script>

<div class="ring-map">
	<h3 class="ring-map__title">PHI LOOP — 32 Rings</h3>
	<div class="ring-map__grid">
		{#each rings as ring (ring.id)}
			<div
				class="ring-cell"
				class:complete={ring.status === 'complete'}
				class:in-progress={ring.status === 'in-progress'}
				class:blocked={ring.status === 'blocked'}
				class:pending={ring.status === 'pending'}
				title={ring.label + (ring.progress ? `: ${ring.progress}%` : '')}
			>
				<span class="ring-number">{ring.id.toString().padStart(2, '0')}</span>
				{#if ring.progress !== undefined && ring.progress > 0}
					<div class="ring-progress" style="width: {ring.progress}%"></div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.ring-map {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
	}
	.ring-map__title {
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 8px;
	}
	.ring-map__grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 6px;
	}
	.ring-cell {
		position: relative;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		background: var(--bg-2);
		border: 1px solid var(--border-2);
		overflow: hidden;
	}
	.ring-cell.complete {
		background: var(--success-color-dimmed);
		border-color: var(--success-color);
	}
	.ring-cell.in-progress {
		background: var(--warning-color-dimmed);
		border-color: var(--warning-color);
	}
	.ring-cell.blocked {
		background: var(--error-color-dimmed);
		border-color: var(--error-color);
	}
	.ring-cell.pending {
		opacity: 0.4;
	}
	.ring-number {
		font-size: 11px;
		font-weight: 500;
	}
	.ring-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 2px;
		background: var(--accent-color);
		transition: width 0.3s;
	}
</style>
