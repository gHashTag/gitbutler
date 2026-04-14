<script lang="ts">
	import type { RepoInfo } from '$lib/orchestrator/orchestratorTypes';

	interface Props {
		projectId: string;
	}

	const { projectId }: Props = $props();

	const repos: RepoInfo[] = [
		{
			name: 'gitbutler',
			path: '/Users/playra/gitbutler',
			branch: 'main',
			status: 'clean',
			lastCommit: '2h ago'
		},
		{
			name: 't27',
			path: '/Users/playra/t27',
			branch: 'dev',
			status: 'dirty',
			lastCommit: '1d ago'
		},
		{
			name: 'trinity-core',
			path: '/Users/playra/trinity-core',
			branch: 'master',
			status: 'ahead',
			lastCommit: '3d ago'
		}
	];
</script>

<div class="repo-fleet">
	<h3 class="repo-fleet__title">Repository Fleet</h3>
	<div class="repo-fleet__list">
		{#each repos as repo (repo.name + repo.path)}
			<div class="repo-card" class:{repo.status}>
				<div class="repo-header">
					<span class="repo-icon">📦</span>
					<span class="repo-name">{repo.name}</span>
					<span class="repo-status-badge">{repo.status}</span>
				</div>
				<div class="repo-details">
					<div class="repo-detail">
						<span class="detail-label">Branch:</span>
						<span class="detail-value">{repo.branch}</span>
					</div>
					{#if repo.lastCommit}
						<div class="repo-detail">
							<span class="detail-label">Last commit:</span>
							<span class="detail-value">{repo.lastCommit}</span>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.repo-fleet {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
	}
	.repo-fleet__title {
		font-size: 14px;
		font-weight: 600;
		margin: 0 0 8px;
	}
	.repo-fleet__list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.repo-card {
		padding: 10px;
		border-radius: 6px;
		background: var(--bg-2);
		border: 1px solid var(--border-2);
	}
	.repo-card.clean {
		border-left: 3px solid var(--success-color);
	}
	.repo-card.dirty {
		border-left: 3px solid var(--warning-color);
		background: var(--warning-color-dimmed);
	}
	.repo-card.ahead {
		border-left: 3px solid var(--info-color);
	}
	.repo-card.behind {
		border-left: 3px solid var(--error-color);
	}
	.repo-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.repo-icon {
		font-size: 14px;
	}
	.repo-name {
		flex: 1;
		font-size: 13px;
		font-weight: 500;
	}
	.repo-status-badge {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 10px;
		background: var(--bg-3);
		text-transform: uppercase;
	}
	.repo-details {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.repo-detail {
		display: flex;
		gap: 6px;
		font-size: 11px;
	}
	.detail-label {
		opacity: 0.6;
	}
	.detail-value {
		font-weight: 500;
	}
</style>
