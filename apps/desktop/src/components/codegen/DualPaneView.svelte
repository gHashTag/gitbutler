<script lang="ts">
  import { parseAgentResponse, getActionIcon, getActionLabel, type ParsedResponse, type Action } from '$lib/utils/agentParser';
  import { onMount } from 'svelte';

  let { content = '', showActions = true }: { content?: string; showActions?: boolean } = $props();

  let parsed: ParsedResponse = $state({ reasoning: '', actions: [], raw: '' });
  let selectedAction: Action | null = $state(null);
  let showFullReasoning = $state(false);
  let reasoningPreviewLength = 500;

  onMount(() => {
    updateParsed();
  });

  $effect(() => {
    updateParsed();
  });

  function updateParsed() {
    parsed = parseAgentResponse(content);
  }

  function truncateReasoning(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function toggleReasoning() {
    showFullReasoning = !showFullReasoning;
  }

  function selectAction(action: Action) {
    selectedAction = selectedAction === action ? null : action;
  }

  function getActionTypeClass(type: Action['type']): string {
    const base = 'action-item';
    const typeClasses: Record<Action['type'], string> = {
      'bash': 'action-bash',
      'file-create': 'action-file-create',
      'file-modify': 'action-file-modify',
      'file-read': 'action-file-read',
      'branch-create': 'action-branch',
      'commit': 'action-commit',
      'tool': 'action-tool',
    };
    return `${base} ${typeClasses[type] || ''}`;
  }
</script>

<div class="dual-pane">
  <!-- Left Pane: Reasoning -->
  <div class="pane pane-reasoning">
    <div class="pane-header">
      <span class="pane-title">🧠 Reasoning</span>
      {#if parsed.reasoning.length > reasoningPreviewLength}
        <button class="toggle-btn" onclick={toggleReasoning}>
          {showFullReasoning ? 'Show less' : 'Show more'}
        </button>
      {/if}
    </div>
    <div class="pane-content">
      {#if parsed.reasoning}
        <div class="reasoning-text">
          {#if showFullReasoning}
            {@html parsed.reasoning}
          {:else}
            {@html truncateReasoning(parsed.reasoning, reasoningPreviewLength)}
          {/if}
        </div>
      {:else}
        <div class="empty-state">
          <span class="empty-icon">💭</span>
          <span>No reasoning detected</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Right Pane: Actions -->
  {#if showActions}
    <div class="pane pane-actions">
      <div class="pane-header">
        <span class="pane-title">⚡ Actions ({parsed.actions.length})</span>
      </div>
      <div class="pane-content">
        {#if parsed.actions.length > 0}
          <div class="actions-list">
            {#each parsed.actions as action, i}
              <div
                class={getActionTypeClass(action.type)}
                class:selected={selectedAction === action}
                onclick={() => selectAction(action)}
              >
                <span class="action-icon">{getActionIcon(action.type)}</span>
                <span class="action-text">{getActionLabel(action)}</span>
                {#if selectedAction === action && action.command}
                  <div class="action-detail">
                    <code>{action.command}</code>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <span class="empty-icon">🎯</span>
            <span>No actions detected</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .dual-pane {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    min-height: 300px;
  }

  .pane {
    background: var(--color-bg-subtle);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--color-bg-muted);
    border-bottom: 1px solid var(--color-border);
  }

  .pane-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-fg-default);
  }

  .toggle-btn {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.75rem;
    cursor: pointer;
    color: var(--color-fg-muted);
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: var(--color-bg-subtle);
    color: var(--color-fg-default);
  }

  .pane-content {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    max-height: 400px;
  }

  .reasoning-text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-fg-default);
    white-space: pre-wrap;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-fg-muted);
    font-size: 0.875rem;
    gap: 8px;
  }

  .empty-icon {
    font-size: 2rem;
    opacity: 0.5;
  }

  /* Actions */
  .actions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    background: var(--color-bg-default);
    border-radius: 6px;
    border: 1px solid var(--color-border-muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-item:hover {
    border-color: var(--color-border);
    background: var(--color-bg-subtle);
  }

  .action-item.selected {
    border-color: var(--color-accent);
    background: var(--color-bg-subtle);
  }

  .action-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .action-text {
    font-size: 0.8125rem;
    color: var(--color-fg-default);
    flex: 1;
    word-break: break-word;
  }

  .action-detail {
    margin-top: 8px;
    padding: 8px;
    background: var(--color-bg-muted);
    border-radius: 4px;
    width: 100%;
  }

  .action-detail code {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-fg-default);
    word-break: break-all;
  }

  /* Action type styles */
  .action-bash {
    border-left: 3px solid #f59e0b;
  }

  .action-file-create {
    border-left: 3px solid #10b981;
  }

  .action-file-modify {
    border-left: 3px solid #3b82f6;
  }

  .action-file-read {
    border-left: 3px solid #8b5cf6;
  }

  .action-branch {
    border-left: 3px solid #ec4899;
  }

  .action-commit {
    border-left: 3px solid #6366f1;
  }

  .action-tool {
    border-left: 3px solid #14b8a6;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dual-pane {
      grid-template-columns: 1fr;
    }
  }
</style>
