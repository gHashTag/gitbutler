<script lang="ts">
  import { Button } from "@gitbutler/ui";
  import { getContext } from "svelte";

  // Get backend from context
  const backend = getContext("backend") as { invoke: (cmd: string, args?: any) => Promise<any> };

  interface Props {
    projectId?: string;
    branchName?: string;
    content?: string; // AI response to extract PR details from
    onCreated?: (prUrl: string) => void;
  }

  let { projectId, branchName, content, onCreated }: Props = $props();

  let isCreating = $state(false);
  let error = $state<string | null>(null);
  let prData = $state<{
    title: string;
    body: string;
    isDraft: boolean;
    riskLevel: "low" | "medium" | "high";
    changedFiles: number;
  } | null>(null);

  // Extract PR title from AI response
  const prTitle = $derived(
    ((): string | null => {
      if (!content) return null;
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || trimmed.startsWith("##")) {
          return trimmed.replace(/^#+\s*/, "");
        }
        if (trimmed.length > 10 && trimmed.length < 100 && /^[A-Z]/.test(trimmed)) {
          return trimmed;
        }
      }
      return null;
    })()
  );

  // Calculate risk level based on content
  const riskLevel = $derived(
    ((): "low" | "medium" | "high" => {
      if (!content) return "low";

      const dangerousPatterns = [
        /delete/i,
        /drop\s+(table|database)/i,
        /rm\s+-rf/i,
        /force\s*:/i,
        /rebase\s+-i/i,
        /git\s+reset/i,
      ];

      const highRiskPatterns = [
        /migration/i,
        /schema/i,
        /breaking/i,
        /deprecated/i,
      ];

      const hasDangerous = dangerousPatterns.some((p) => p.test(content));
      const hasHighRisk = highRiskPatterns.some((p) => p.test(content));

      if (hasDangerous) return "high";
      if (hasHighRisk) return "medium";
      return "low";
    })()
  );

  // Count changed files from content
  const changedFilesCount = $derived(
    ((): number => {
      if (!content) return 0;
      const fileMatches = content.match(/(?:Created|Modified|Edited|Changed):\s*(\S+)/gi);
      return fileMatches ? fileMatches.length : 0;
    })()
  );

  // Generate PR body from AI response
  const prBody = $derived(
    ((): string => {
      if (!content) return "";
      return content
        .replace(/```bash\n[\s\S]*?```/g, "") // Remove bash blocks
        .replace(/```\w*\n[\s\S]*?```/g, "") // Remove other code blocks
        .replace(/^#+\s.*$/gm, "") // Remove headers
        .trim();
    })()
  );

  function getRiskColor(level: string): string {
    switch (level) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  }

  function getRiskLabel(level: string): string {
    switch (level) {
      case "high":
        return "🔴 High Risk";
      case "medium":
        return "🟡 Medium Risk";
      default:
        return "🟢 Low Risk";
    }
  }

  async function createDraftPR() {
    if (!projectId || !branchName) {
      error = "Missing project ID or branch name";
      return;
    }

    isCreating = true;
    error = null;

    try {
      const result = await backend.invoke("create_pull_request", {
        projectId,
        title: prTitle || `Draft: ${branchName}`,
        body: prBody,
        headBranch: branchName,
        baseBranch: "master",
        draft: true,
      });

      if (onCreated && typeof result === "object" && "url" in result) {
        onCreated((result as { url: string }).url);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to create PR";
    } finally {
      isCreating = false;
    }
  }

  // Check if PR creation is available
  const canCreatePR = $derived(
    ((): boolean => {
      if (!projectId || !branchName) return false;
      // Only for ring branches
      return /^ring-\d+/i.test(branchName);
    })()
  );
</script>

{#if canCreatePR}
  <div class="pr-draft-panel">
    <div class="pr-draft-header">
      <span class="pr-draft-title">📋 Pull Request Draft</span>
      <span class="risk-badge" class:risk-high={riskLevel === "high"} class:risk-medium={riskLevel === "medium"}>
        {getRiskLabel(riskLevel)}
      </span>
    </div>

    <div class="pr-draft-content">
      {#if prTitle}
        <div class="pr-title-preview">
          <strong>Title:</strong> {prTitle}
        </div>
      {/if}

      <div class="pr-stats">
        <div class="pr-stat">
          <span class="pr-stat-icon">📄</span>
          <span class="pr-stat-value">{changedFilesCount}</span>
          <span class="pr-stat-label">files changed</span>
        </div>
        <div class="pr-stat">
          <span class="pr-stat-icon">🌿</span>
          <span class="pr-stat-value">{branchName}</span>
          <span class="pr-stat-label">branch</span>
        </div>
      </div>

      {#if error}
        <div class="pr-error">{error}</div>
      {/if}

      <div class="pr-actions">
        <Button
          kind="solid"
          disabled={isCreating}
          onclick={createDraftPR}
        >
          {isCreating ? "Creating..." : "Create Draft PR"}
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .pr-draft-panel {
    background: var(--bg-subtle);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    overflow: hidden;
    margin-top: 1rem;
  }

  .pr-draft-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
  }

  .pr-draft-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--fg-default);
  }

  .risk-badge {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    background: #10b981;
    color: white;
  }

  .risk-badge.risk-medium {
    background: #f59e0b;
  }

  .risk-badge.risk-high {
    background: #ef4444;
  }

  .pr-draft-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pr-title-preview {
    font-size: 0.875rem;
    color: var(--fg-default);
    padding: 0.5rem 0.75rem;
    background: var(--bg-canvas);
    border-radius: 4px;
  }

  .pr-stats {
    display: flex;
    gap: 1rem;
  }

  .pr-stat {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--fg-muted);
  }

  .pr-stat-icon {
    font-size: 1rem;
  }

  .pr-stat-value {
    font-weight: 600;
    color: var(--fg-default);
  }

  .pr-stat-label {
    color: var(--fg-muted);
  }

  .pr-error {
    padding: 0.5rem 0.75rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
    font-size: 0.875rem;
  }

  .pr-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.5rem;
  }
</style>
