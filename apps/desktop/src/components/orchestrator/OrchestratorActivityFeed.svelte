<script lang="ts">
	import type { ActivityItem } from '$lib/orchestrator/orchestratorTypes';

	interface Props {
		projectId: string;
	}

	const { projectId }: Props = $props();

	const activities: ActivityItem[] = [
		{
			id: '1',
			type: 'agent',
			message: 'Agent Alpha started task: Implement feature X',
			timestamp: '2m ago',
			status: 'info'
		},
		{
			id: '2',
			type: 'ring',
			message: 'Ring 7 completed',
			timestamp: '5m ago',
			status: 'info'
		},
		{
			id: '3',
			type: 'system',
			message: 'Sync completed successfully',
			timestamp: '10m ago',
			status: 'info'
		},
		{
			id: '4',
			type: 'agent',
			message: 'Agent Beta encountered error: Permission denied',
			timestamp: '15m ago',
			status: 'error'
		}
	];
</script>

<div class="activity-feed">
	<h3 class="activity-feed__title">Activity Log</h3>
	<div class="activity-feed__list">
		{#each activities as activity (activity.id)}
			<div
				class="activity-item"
				class:info={activity.status === 'info'}
				class:warning={activity.status === 'warning'}
				class:error={activity.status === 'error'}
			>
				<span class="activity-icon">
					{#if activity.type === 'agent'}🤖{/if}
					{#if activity.type === 'ring'}⭕{/if}
					{#if activity.type === 'system'}⚙️{/if}
				</span>
				<div class="activity-content">
					<p class="activity-message">{activity.message}</p>
					<span class="activity-time">{activity.timestamp}</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.activity-feed {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
	}
	.activity-feed__title {
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 8px;
	}
	.activity-feed__list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.activity-item {
		display: flex;
		gap: 8px;
		padding: 8px;
		border-radius: 6px;
		background: var(--bg-2);
		border-left: 3px solid var(--border-2);
	}
	.activity-item.info {
		border-left-color: var(--info-color);
	}
	.activity-item.warning {
		border-left-color: var(--warning-color);
	}
	.activity-item.error {
		border-left-color: var(--error-color);
		background: var(--error-color-dimmed);
	}
	.activity-icon {
		font-size: 16px;
	}
	.activity-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.activity-message {
		margin: 0;
		font-size: 12px;
		line-height: 1.3;
	}
	.activity-time {
		font-size: 10px;
		opacity: 0.6;
	}
</style>
