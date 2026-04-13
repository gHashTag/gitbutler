<script lang="ts" module>
	export interface RingStatus {
		number: number;
		phase: string | null;
		status: 'complete' | 'active' | 'blocked' | 'pending';
		branchExists: boolean;
		branchName?: string;
	}
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';

	const TOTAL_RINGS = 32;

	interface Props {
		projectId?: string;
	}
	const { projectId }: Props = $props();

	let rings = $state<RingStatus[]>([]);

	const STATUS_COLORS: Record<string, string> = {
		complete: '#10b981',
		active: '#3b82f6',
		blocked: '#ef4444',
		pending: '#374151',
	};

	const PHASE_LABELS: Record<string, string> = {
		spec: 'Spec',
		tdd: 'TDD',
		impl: 'Code',
		gen: 'Gen',
		seal: 'Seal',
		verify: 'Verify',
		land: 'Land',
		learn: 'Learn',
	};

	let refreshInterval: ReturnType<typeof setInterval>;

	// Initialize rings
	function initializeRings() {
		const newRings: RingStatus[] = [];
		for (let i = 0; i < TOTAL_RINGS; i++) {
			newRings.push({
				number: i,
				phase: null,
				status: 'pending',
				branchExists: false,
			});
		}
		rings = newRings;
	}

	// Fetch git branches and update ring status
	async function refreshRingStatus() {
		try {
			// Try to use Tauri command to get branches
			// Fallback to backend.invoke pattern
			const result = await invoke('shell_command', {
				command: 'git',
				args: ['-C', '$HOME/t27', 'branch', '-a'],
			}) as string;

			const lines = result.split('\n');
			const ringMap = new Map<number, { phase: string; branchName: string; status: string }>();

			for (const line of lines) {
				const match = line.match(/ring-(\d+)-(\w+)/i);
				if (match && match[0] && match[1] && match[2]) {
					const ringNum = parseInt(match[1]);
					const phase = match[2];
					const branchName = match[0].trim();

					// Determine status based on phase
					let status: 'complete' | 'active' | 'blocked' | 'pending' = 'active';
					if (phase === 'blocked') status = 'blocked';
					else if (phase === 'land' || phase === 'learn') status = 'complete';

					ringMap.set(ringNum, { phase, branchName, status });
				}
			}

			// Update rings array
			rings = rings.map(ring => {
				const info = ringMap.get(ring.number);
				if (info) {
					return {
						...ring,
						phase: info.phase,
						branchExists: true,
						branchName: info.branchName,
						status: info.status as 'complete' | 'active' | 'blocked' | 'pending',
					};
				}
				return ring;
			});
		} catch (e) {
			console.error('Failed to refresh ring status:', e);
		}
	}

	function handleRingClick(ring: RingStatus) {
		// Open GitHub issue for this ring
		const url = `https://github.com/playra/t27/issues/${ring.number}`;
		window.open(url, '_blank');
	}

	onMount(() => {
		initializeRings();
		refreshRingStatus();
		refreshInterval = setInterval(refreshRingStatus, 30000); // Refresh every 30s
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
	});
</script>

<div class="ring-map">
	<div class="ring-grid">
		{#each rings as ring}
			<div class="ring-cell-wrapper">
				<div
					role="button"
					tabindex="0"
					class="ring-cell"
					class:ring-cell--complete={ring.status === 'complete'}
					class:ring-cell--active={ring.status === 'active'}
					class:ring-cell--blocked={ring.status === 'blocked'}
					title="Ring {ring.number}{ring.branchName ? `: ${ring.branchName} — ${ring.status}` : ' — not started'}"
					onclick={() => handleRingClick(ring)}
					onkeydown={(e) => e.key === 'Enter' && handleRingClick(ring)}
				>
					{ring.number}
				</div>
				{#if ring.branchExists}
					<div class="ring-indicator" style="background: {STATUS_COLORS[ring.status]}"></div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	.ring-grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 4px;
		padding: 12px;
	}
	.ring-cell-wrapper {
		position: relative;
	}
	.ring-cell {
		aspect-ratio: 1;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		color: white;
		cursor: pointer;
		position: relative;
		background: var(--bg-3);
		transition: opacity 0.15s;
	}
	.ring-cell:hover {
		opacity: 0.8;
	}
	.ring-cell--complete {
		background: #10b981;
	}
	.ring-cell--active {
		background: #3b82f6;
	}
	.ring-cell--blocked {
		background: #ef4444;
	}
	.ring-indicator {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
	}
</style>
