<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    branchName?: string;
    showRisk?: boolean;
  }

  let { branchName, showRisk = true }: Props = $props();

  type CiStatus = "pending" | "running" | "success" | "failure" | "unknown";
  type RiskLevel = "low" | "medium" | "high" | "critical";

  let ciStatus = $state<CiStatus>("unknown");
  let riskLevel = $state<RiskLevel>("low");
  let changedFiles = $state(0);
  let linesChanged = $state(0);

  onMount(async () => {
    if (branchName) {
      await fetchCiStatus();
      await calculateRisk();
    }
  });

  async function fetchCiStatus() {
    // This would typically call a backend API to get real CI status
    // For now, we'll simulate it
    try {
      // In a real implementation, this would be:
      // const result = await backend.invoke('get_ci_status', { branchName });
      ciStatus = "pending"; // Default to pending for new branches
    } catch (e) {
      ciStatus = "unknown";
    }
  }

  async function calculateRisk() {
    // Calculate risk based on branch context
    // For ring branches, check the phase and estimated changes

    if (!branchName) {
      riskLevel = "low";
      return;
    }

    // Check if it's a ring branch
    const ringMatch = branchName.match(/ring-(\d+)-([a-z-]+)/i);
    if (!ringMatch) {
      riskLevel = "medium";
      return;
    }

    const phase = ringMatch[2] || '';
    const ringNumber = parseInt(ringMatch[1] || '0', 10);

    // Risk assessment based on phase
    // Higher risk for phases that touch core logic
    const highRiskPhases = ["impl", "gen", "verify"];
    const mediumRiskPhases = ["spec", "tdd", "seal"];
    const lowRiskPhases = ["issue", "land", "learn"];

    if (highRiskPhases.includes(phase)) {
      riskLevel = ringNumber < 10 ? "high" : "medium";
    } else if (mediumRiskPhases.includes(phase)) {
      riskLevel = "medium";
    } else {
      riskLevel = "low";
    }

    // In a real implementation, we'd also check:
    // - Number of files changed
    // - Lines of code changed
    // - Test coverage
    // - Whether gen/ files were modified
  }

  function getStatusIcon(): string {
    switch (ciStatus) {
      case "pending":
        return "⏳";
      case "running":
        return "🔄";
      case "success":
        return "✅";
      case "failure":
        return "❌";
      default:
        return "❓";
    }
  }

  function getStatusLabel(): string {
    switch (ciStatus) {
      case "pending":
        return "CI Pending";
      case "running":
        return "CI Running";
      case "success":
        return "All Checks Passed";
      case "failure":
        return "CI Failed";
      default:
        return "Unknown";
    }
  }

  function getRiskIcon(): string {
    switch (riskLevel) {
      case "low":
        return "🟢";
      case "medium":
        return "🟡";
      case "high":
        return "🟠";
      case "critical":
        return "🔴";
      default:
        return "⚪";
    }
  }

  function getRiskLabel(): string {
    switch (riskLevel) {
      case "low":
        return "Low Risk";
      case "medium":
        return "Medium Risk";
      case "high":
        return "High Risk";
      case "critical":
        return "Critical Risk";
      default:
        return "Unknown Risk";
    }
  }

  function getRiskColor(): string {
    switch (riskLevel) {
      case "low":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "high":
        return "#f97316";
      case "critical":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }
</script>

{#if branchName}
  <div class="ci-status-wrapper">
    <!-- CI Status -->
    <div class="ci-status">
      <span class="ci-status__icon">{getStatusIcon()}</span>
      <span class="ci-status__label">{getStatusLabel()}</span>
    </div>

    <!-- Risk Indicator -->
    {#if showRisk}
      <div class="risk-indicator">
        <span class="risk-indicator__icon">{getRiskIcon()}</span>
        <span
          class="risk-indicator__label"
          style:color={getRiskColor()}
        >
          {getRiskLabel()}
        </span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .ci-status-wrapper {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px;
    background: var(--bg-2);
    border-radius: var(--radius-s);
    border: 1px solid var(--border-2);
  }

  .ci-status,
  .risk-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .ci-status__icon,
  .risk-indicator__icon {
    font-size: 14px;
  }

  .ci-status__label,
  .risk-indicator__label {
    color: var(--text-2);
    font-weight: 500;
  }

  .ci-status__label {
    min-width: 80px;
  }
</style>
