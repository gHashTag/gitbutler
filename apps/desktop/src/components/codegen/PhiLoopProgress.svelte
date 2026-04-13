<script lang="ts">
	import { PHASES, PHASE_MAP, parsePhaseSuffix, isRingBranch } from "$lib/utils/phiLoop";

	interface Props {
		branchName: string;
	}
	const { branchName }: Props = $props();

	// Detect current phase from branch name suffix
	const currentPhase = $derived.by(() => {
		const suffix = parsePhaseSuffix(branchName);
		return suffix ? PHASE_MAP[suffix] ?? null : null;
	});

	// Check if this is a ring branch at all
	const isRing = $derived(isRingBranch(branchName));

	function getPhaseState(index: number): "complete" | "current" | "upcoming" {
		if (currentPhase === null) return "upcoming";
		if (index < currentPhase) return "complete";
		if (index === currentPhase) return "current";
		return "upcoming";
	}
</script>

{#if isRing && currentPhase !== null}
	<div class="phi-loop-progress">
		{#each PHASES as phase, index}
			{@const state = getPhaseState(index + 1)}
			<div class="phi-loop-progress__item" class:current={state === "current"} class:complete={state === "complete"} class:upcoming={state === "upcoming"}>
				<div class="phi-loop-progress__dot">
					{#if state === "complete"}
						<div class="phi-loop-progress__dot-filled"></div>
					{:else if state === "current"}
						<div class="phi-loop-progress__dot-current"></div>
					{:else}
						<div class="phi-loop-progress__dot-empty"></div>
					{/if}
				</div>
				<span class="phi-loop-progress__label">{phase.name}</span>
				{#if index < PHASES.length - 1}
					<div class="phi-loop-progress__connector"></div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style lang="postcss">
	.phi-loop-progress {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--bg-1);
		border-bottom: 1px solid var(--border-2);
		gap: 4px;
	}

	.phi-loop-progress__item {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.phi-loop-progress__dot {
		flex-shrink: 0;
		width: 14px;
		height: 14px;
	}

	.phi-loop-progress__dot-filled {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: var(--text-2);
	}

	.phi-loop-progress__dot-current {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: var(--text-2);
		position: relative;
	}

	.phi-loop-progress__dot-current::after {
		content: "";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--bg-1);
	}

	.phi-loop-progress__dot-empty {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 1.5px solid var(--text-3);
		background: transparent;
	}

	.phi-loop-progress__label {
		font-size: 10px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.phi-loop-progress__item.current .phi-loop-progress__label {
		color: var(--text-1);
	}

	.phi-loop-progress__item.complete .phi-loop-progress__label {
		color: var(--text-2);
	}

	.phi-loop-progress__item.upcoming .phi-loop-progress__label {
		color: var(--text-3);
	}

	.phi-loop-progress__connector {
		flex-shrink: 0;
		width: 12px;
		height: 1px;
		background: var(--border-2);
	}
</style>
