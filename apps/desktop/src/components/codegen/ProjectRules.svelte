<script lang="ts">
	import { BACKEND } from "$lib/backend";
	import { inject } from "@gitbutler/core/context";
	import { Icon } from "@gitbutler/ui";
	import { onMount } from "svelte";

	interface Props {
		projectId: string;
	}
	const { projectId }: Props = $props();

	const backend = inject(BACKEND);

	let rules = $state<string | null>(null);
	let loading = $state(true);
	let expanded = $state(true);

	onMount(async () => {
		try {
			const content = await backend.readFile(".gitbutler/rules.md");
			const decoder = new TextDecoder();
			rules = decoder.decode(content);
		} catch (err) {
			// File doesn't exist or can't be read - that's OK
			rules = null;
		} finally {
			loading = false;
		}
	});

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

{#if !loading && rules}
	<div class="project-rules">
		<button
			type="button"
			class="project-rules__header"
			onclick={toggleExpanded}
		>
			<span class="project-rules__arrow" class:expanded>
				<Icon name="chevron-right" size={12} />
			</span>
			<span class="project-rules__title">Project Rules</span>
			<span class="project-rules__badge">.gitbutler/rules.md</span>
		</button>
		{#if expanded}
			<div class="project-rules__content">
				<pre class="project-rules__text">{rules}</pre>
			</div>
		{/if}
	</div>
{/if}

<style lang="postcss">
	.project-rules {
		margin: 0 20px 12px 20px;
		background: var(--bg-1);
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
		overflow: hidden;
	}

	.project-rules__header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 12px;
		background: var(--bg-2);
		border: none;
		cursor: pointer;
		transition: background-color var(--transition-fast);

		&:hover {
			background: var(--hover-bg-2);

			.project-rules__arrow {
				color: var(--text-2);
			}
		}
	}

	.project-rules__arrow {
		display: flex;
		color: var(--text-3);
		transition: transform var(--transition-medium);

		&.expanded {
			transform: rotate(90deg);
		}
	}

	.project-rules__title {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-1);
	}

	.project-rules__badge {
		margin-left: auto;
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--bg-3);
		color: var(--text-3);
	}

	.project-rules__content {
		padding: 12px;
		border-top: 1px solid var(--border-2);
	}

	.project-rules__text {
		font-size: 11px;
		font-family: var(--font-code);
		color: var(--text-2);
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.5;
		margin: 0;
	}
</style>
