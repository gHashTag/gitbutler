<script lang="ts">
	import { reposStore, type RepoStatus } from '$lib/orchestrator';

	interface Props {
		projectId: string;
	}
	const { projectId }: Props = $props();
</script>

<div class="repo-fleet">
	{#each $reposStore as repo}
		<div class="repo-card">
			<div
				class="repo-card__dot"
				class:green={repo.ciStatus === 'passing'}
				class:red={repo.ciStatus === 'failing'}
				class:amber={repo.ciStatus === 'running'}
			></div>
			<div class="repo-card__info">
				<span class="repo-name">{repo.name}</span>
				{#if repo.currentRing}
					<span class="repo-ring-badge">Ring {repo.currentRing}</span>
				{/if}
				{#if repo.activeAgents}
					<span class="repo-agents">{repo.activeAgents} agents</span>
				{/if}
			</div>
			{#if repo.lastCommit}
				<div class="repo-last-commit">{repo.lastCommit}</div>
			{/if}
			<span
				class="state-icon"
				style:background={
					repo.ciStatus === 'passing'
						? 'var(--success-bg)'
						: repo.ciStatus === 'failing'
							? 'var(--danger-bg)'
							: 'var(--pending-bg)'
				}
			>
				{#if repo.ciStatus === 'passing'}
					✓
				{:else if repo.ciStatus === 'failing'}
					✗
				{:else if repo.ciStatus === 'running'}
					⏳
				{:else}
					?
				{/if}
			</span>
		</div>
	{/each}
</div>

<style lang="postcss">
	.repo-fleet {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;
	}
	.repo-card {
		border: 1px solid var(--border-2);
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		padding: 12px;
		background: var(--bg-1);
	}
	.repo-card__dot {
		flex-shrink: 0;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.repo-card__dot.green {
		background: var(--success-bg);
	}
	.repo-card__dot.red {
		background: var(--danger-bg);
	}
	.repo-card__dot.amber {
		background: var(--warning-bg);
	}
	.repo-card__info {
		flex: 1;
		min-width: 0;
	}
	.repo-card__header {
		display: flex;
		gap: 4px;
		font-size: 12px;
		font-weight: 500;
	}
	.repo-name {
		color: var(--text-1);
	}
	.repo-ring-badge {
		margin-left: auto;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--bg-3);
		color: var(--text-1);
		font-weight: 500;
	}
	.repo-agents {
		font-size: 10px;
		color: var(--text-2);
	}
	.repo-last-commit {
		font-size: 10px;
		color: var(--text-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.state-icon {
		flex-shrink: 0;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
