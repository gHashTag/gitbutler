<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { readTextFile, exists } from '@tauri-apps/plugin-fs';
	import { homeDir, join } from '@tauri-apps/api/path';
	import { inject } from '@gitbutler/core/context';
	import { BACKEND } from '$lib/backend';

	interface ActivityEvent {
		id: string;
		timestamp: Date;
		type: 'commit' | 'branch' | 'push' | 'agent' | 'phi-loop' | 'error';
		message: string;
		branch?: string;
		ring?: number;
	}

	let events = $state<ActivityEvent[]>([]);
	let interval: ReturnType<typeof setInterval>;

	export type Props = {
		projectId: string;
	}
	const { projectId }: Props = $props();

	const backend = inject(BACKEND);

	// Read ~/.trinity/experience/episodes.jsonl
	async function refreshActivity() {
		const newEvents: ActivityEvent[] = [];

		try {
			// Get home directory and construct path to episodes.jsonl
			const home = await homeDir();
			const episodesPath = await join(home, '.trinity', 'experience', 'episodes.jsonl');

			if (await exists(episodesPath)) {
				const raw = await readTextFile(episodesPath);
				const lines = raw.trim().split('\n');
				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const ep = JSON.parse(line);
						newEvents.push({
							id: ep.id || crypto.randomUUID(),
							timestamp: new Date(ep.timestamp),
							type: ep.feedback === 1 ? 'phi-loop' : 'agent',
							message: ep.lesson?.slice(0, 80) || ep.content?.slice(0, 80) || 'PHI LOOP event',
							ring: ep.ring
						});
					} catch {
						// Skip invalid JSON lines
					}
				}
			}
		} catch (e) {
			// Silently fail if episodes.jsonl doesn't exist or can't be read
		}

		events = newEvents.sort((a, b) =>
			b.timestamp.getTime() - a.timestamp.getTime()
		).slice(0, 20);
	}

	onMount(() => {
		refreshActivity();
		interval = setInterval(() => refreshActivity(), 5000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="activity-feed">
	{#if events.length === 0}
		<div class="activity-empty">No recent activity</div>
	{:else}
		{#each events as event}
			<div class="activity-item activity-item--{event.type}">
				<span class="activity-time">
					{new Intl.RelativeTimeFormat('en', { numeric: 'auto' })}
					.format(
						Math.round((event.timestamp.getTime() - Date.now()) / 60000),
						'minute'
					)}
				</span>
				<span class="activity-message">{event.message}</span>
				{#if event.ring}
					<span class="activity-ring">ring-{String(event.ring).padStart(3, '0')}</span>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style lang="postcss">
	.activity-feed {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.activity-empty {
		font-size: 11px;
		color: var(--text-3);
		padding: 12px 16px;
		text-align: center;
	}
	.activity-item {
		display: flex;
		gap: 4px;
		font-size: 12px;
	}
	.activity-time {
		font-size: 10px;
		color: var(--text-3);
		min-width: 60px;
	}
	.activity-message {
		flex: 1;
		font-size: 12px;
		color: var(--text-1);
	}
	.activity-ring {
		font-size: 10px;
		color: var(--text-2);
		padding-left: 4px;
	}
</style>
