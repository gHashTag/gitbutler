<script lang="ts">
  import { Button } from "@gitbutler/ui";
  import { getContext } from "svelte";

  // Get backend and project from context
  const backend = getContext("backend") as any;
  const project = getContext("project") as { id: string; name: string };

  let { branchName, onCreateDraft }: { branchName?: string; onCreateDraft?: (pr: PrDraft) => void } = $props();

  let isCreating = $state(false);
  let showPreview = $state(false);
  let draftData = $state<PrDraft | null>(null);

  interface PrDraft {
    title: string;
    body: string;
    head: string;
    base: string;
    draft: boolean;
  }

  // Check if branch is a ring branch (ring-NNN-*)
  const isRingBranch = $derived(
    branchName ? /^ring-\d{3}-/.test(branchName) : false
  );

  // Extract ring number for display
  const ringNumber = $derived(
    (() => {
      if (!branchName) return null;
      const match = branchName.match(/ring-(\d+)/i);
      return match ? match[1] : null;
    })()
  );

  // Extract phase for display
  const currentPhase = $derived(
    (() => {
      if (!branchName) return null;
      const match = branchName.match(/ring-\d+-([a-z-]+)/i);
      return match ? match[1] : null;
    })()
  );

  async function createDraftPr() {
    if (!branchName) return;

    isCreating = true;

    try {
      // Extract title and body from current branch context or recent commit
      const ring = ringNumber || "?";
      const phase = currentPhase || "unknown";
      const title = `[Ring ${ring}] ${capitalize(phase)}`;
      const body = generatePrBody(ring, phase);

      draftData = {
        title,
        body,
        head: branchName,
        base: "master",
        draft: true,
      };

      // Call backend to create PR
      // Note: This assumes GitButler has a create_pull_request Tauri command
      // If not available, we'll just emit the draft data
      if (onCreateDraft) {
        onCreateDraft(draftData);
      } else {
        // Try to invoke backend command
        try {
          await backend.invoke("create_pull_request", {
            projectId: project.id,
            title: draftData.title,
            body: draftData.body,
            headBranch: draftData.head,
            baseBranch: draftData.base,
            draft: true,
          });
        } catch (e) {
          console.warn("PR creation via backend not available, using draft data:", e);
          showPreview = true;
        }
      }

      showPreview = true;
    } catch (error) {
      console.error("Failed to create draft PR:", error);
    } finally {
      isCreating = false;
    }
  }

  function generatePrBody(ring: string, phase: string): string {
    return `## Ring ${ring} - ${capitalize(phase)}

This PR is part of the PHI LOOP development cycle for ring ${ring}.

### Phase: ${capitalize(phase)}

### Changes
<!-- Add description of changes here -->

### Checklist
- [ ] Code follows project conventions (L3 PURITY: ASCII-only, English identifiers)
- [ ] Tests added/updated (L4 TESTABILITY)
- [ ] Generated files in \`gen/\` are not hand-edited (L2 GENERATION)
- [ ] φ identity calculations use proper precision (L5 IDENTITY)
- [ ] Numeric specs reference SSOT (L6 CEILING)

### Related Issue
Closes #${ring}

---

φ²+φ⁻²=3 | TRINITY`;
  }

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function copyToClipboard() {
    if (!draftData) return;

    const text = `# ${draftData.title}\n\n${draftData.body}`;
    navigator.clipboard.writeText(text);

    // Could add toast notification here
  }

  function closePreview() {
    showPreview = false;
    draftData = null;
  }
</script>

{#if isRingBranch && branchName}
  <div class="pr-draft-container">
    <Button
      kind="solid"
      icon="push"
      onclick={createDraftPr}
      disabled={isCreating}
    >
      {isCreating ? "Creating..." : "Create Draft PR"}
    </Button>

    {#if showPreview && draftData}
      <div class="pr-preview">
        <div class="pr-preview__header">
          <h3>PR Draft Preview</h3>
          <div class="pr-preview__actions">
            <button class="copy-btn" onclick={copyToClipboard}>
              📋 Copy
            </button>
            <button class="close-btn" onclick={closePreview}>
              ✕
            </button>
          </div>
        </div>
        <div class="pr-preview__content">
          <div class="pr-preview__field">
            <label>Title</label>
            <input type="text" value={draftData.title} readonly />
          </div>
          <div class="pr-preview__field">
            <label>From</label>
            <span>{draftData.head}</span>
          </div>
          <div class="pr-preview__field">
            <label>To</label>
            <span>{draftData.base}</span>
          </div>
          <div class="pr-preview__field">
            <label>Body</label>
            <pre>{draftData.body}</pre>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .pr-draft-container {
    position: relative;
    display: inline-block;
  }

  .pr-preview {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 500px;
    max-height: 600px;
    background: var(--bg-1);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .pr-preview__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-2);
    border-bottom: 1px solid var(--border-2);
  }

  .pr-preview__header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-1);
  }

  .pr-preview__actions {
    display: flex;
    gap: 8px;
  }

  .copy-btn,
  .close-btn {
    background: none;
    border: none;
    padding: 4px 8px;
    border-radius: var(--radius-s);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .copy-btn:hover,
  .close-btn:hover {
    background: var(--hover-bg-2);
  }

  .pr-preview__content {
    padding: 16px;
    overflow-y: auto;
    max-height: 500px;
  }

  .pr-preview__field {
    margin-bottom: 16px;
  }

  .pr-preview__field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-2);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pr-preview__field input {
    width: 100%;
    padding: 8px 10px;
    background: var(--bg-2);
    border: 1px solid var(--border-2);
    border-radius: var(--radius-s);
    color: var(--text-1);
    font-size: 13px;
  }

  .pr-preview__field span {
    color: var(--text-1);
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .pr-preview__field pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    background: var(--bg-2);
    padding: 12px;
    border-radius: var(--radius-s);
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-1);
    max-height: 300px;
    overflow-y: auto;
  }
</style>
