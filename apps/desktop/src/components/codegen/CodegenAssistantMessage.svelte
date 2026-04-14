<script lang="ts">
	import { Markdown, Button, CopyButton } from "@gitbutler/ui";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { inject } from "@gitbutler/core/context";
	import { PHASES, PHASE_ORDER, parsePhaseSuffix } from "$lib/utils/phiLoop";

	interface Props {
		content?: string;
		createdAt?: string;
		onInsertIntoCommitMessage?: (content: string) => void;
		onRegenerate?: () => void;
		onFeedback?: (feedback: "up" | "down") => void;
		onExport?: (content: string) => void;
		onOpenInEditor?: (content: string) => void;
		onPin?: (content: string) => void;
		onCreateBranch?: (content: string) => void;
		onCreateNextPhaseBranch?: (content: string) => void;
		branchName?: string;
		isPinned?: boolean;
	}

	let {
		content,
		createdAt,
		onInsertIntoCommitMessage,
		onRegenerate,
		onFeedback,
		onExport,
		onOpenInEditor,
		onPin,
		onCreateBranch,
		onCreateNextPhaseBranch,
		branchName,
		isPinned,
	}: Props = $props();

	const clipboardService = inject(CLIPBOARD_SERVICE);

	let copyFormat = $state<"markdown" | "plain">("markdown");
	let collapsed = $state(false);
	let showCopyOptions = $state(false);
	let showTimestamp = $state(false);

	// Strip markdown for plain text copy
	function stripMarkdown(text: string): string {
		return text
			.replace(/```[\s\S]*?```/g, (match) => {
				// Extract code from code blocks
				const lines = match.split("\n");
				return lines.slice(1, -1).join("\n");
			})
			.replace(/`([^`]+)`/g, "$1")
			.replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
			.replace(/\*\*([^*]+)\*\*/g, "$1")
			.replace(/\*([^*]+)\*/g, "$1")
			.replace(/### ([^\n]+)/g, "$1")
			.replace(/## ([^\n]+)/g, "$1")
			.replace(/# ([^\n]+)/g, "$1")
			.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
			.replace(/^\s*[-*+]\s/gm, "• ")
			.replace(/^\s*\d+\.\s/gm, "")
			.trim();
	}

	async function handleCopy() {
		const textToCopy =
			copyFormat === "plain" ? stripMarkdown(content || "") : content || "";
		await clipboardService.write(textToCopy, {
			message: copyFormat === "plain" ? "Copied as plain text" : "Copied to clipboard",
		});
		showCopyOptions = false;
	}

	function getLinesCount(text: string): number {
		return text.split("\n").length;
	}

	const linesCount = $derived(content ? getLinesCount(content) : 0);
	const shouldCollapse = $derived(linesCount > 20);
	const displayContent = $derived(
		shouldCollapse && collapsed ? content?.split("\n").slice(0, 5).join("\n") + "..." : content
	);

	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString();
	}

	// Create PHASE_NAMES mapping from imported PHASES array
	const PHASE_NAMES: Record<string, string> = $derived.by(() =>
		Object.fromEntries(PHASES.map((p) => [p.value, p.name]))
	);

	// Extract current phase from branch name
	const currentPhase = $derived.by(() => {
		if (!branchName) return null;
		return parsePhaseSuffix(branchName);
	});

	// Get next phase name
	const nextPhase = $derived.by(() => {
		if (!currentPhase) return null;
		const currentIndex = PHASE_ORDER.indexOf(currentPhase);
		if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) return null;
		return PHASE_ORDER[currentIndex + 1];
	});

	// Check if AI response indicates phase completion
	const shouldShowNextPhaseButton = $derived.by(() => {
		if (!content || !nextPhase) return false;
		const phaseCompletePatterns = [
			/phase complete/i,
			/proceed to next phase/i,
			/→ phase \d+/i,
			/next phase/i,
		];
		return phaseCompletePatterns.some((pattern) => pattern.test(content));
	});
</script>

{#if content}
	<div
		class="message-assistant text-13 text-body"
		role="presentation"
		onmouseenter={() => (showTimestamp = true)}
		onmouseleave={() => (showTimestamp = false)}
	>
		<div class="message-assistant__header">
			<span class="message-assistant__timestamp" class:visible={showTimestamp}>
				{createdAt ? formatTimestamp(createdAt) : ""}
			</span>
		</div>
		<Markdown content={displayContent || ""} />
		{#if shouldCollapse}
			<button class="message-assistant__toggle" onclick={() => (collapsed = !collapsed)}>
				{collapsed ? "Show more" : "Show less"}
			</button>
		{/if}
		<div class="message-assistant__actions">
			{#if onRegenerate}
				<Button
					icon="refresh"
					tooltip="Regenerate response"
					kind="ghost"
					onclick={() => onRegenerate()}
				/>
			{/if}
			<div class="message-assistant__actions-copy">
				{#if showCopyOptions}
					<div class="copy-options">
						<button
							class="copy-option"
							onclick={() => {
								copyFormat = "markdown";
								handleCopy();
							}}
						>
							Copy as Markdown
						</button>
						<button
							class="copy-option"
							onclick={() => {
								copyFormat = "plain";
								handleCopy();
							}}
						>
							Copy as Plain Text
						</button>
					</div>
				{:else}
					<Button
						icon="copy"
						tooltip="Copy"
						kind="ghost"
						onclick={() => {
							clipboardService.write(content, { message: "Copied to clipboard" });
						}}
					/>
				{/if}
				<Button
					icon="chevron-down"
					tooltip="Copy options"
					kind="ghost"
					onclick={() => (showCopyOptions = !showCopyOptions)}
				/>
			</div>
			{#if onInsertIntoCommitMessage}
				<Button
					icon="arrow-down"
					tooltip="Insert into commit message"
					kind="ghost"
					onclick={() => onInsertIntoCommitMessage(content)}
				/>
			{/if}
			{#if onFeedback}
				<div class="message-assistant__feedback">
					<Button
						icon="tick"
						tooltip="Helpful"
						kind="ghost"
						onclick={() => onFeedback("up")}
					/>
					<Button
						icon="cross"
						tooltip="Not helpful"
						kind="ghost"
						onclick={() => onFeedback("down")}
					/>
				</div>
			{/if}
			{#if onExport}
				<Button
					icon="file-text"
					tooltip="Export to .md"
					kind="ghost"
					onclick={() => onExport(content)}
				/>
			{/if}
			{#if onOpenInEditor}
				<Button
					icon="open-in-terminal"
					tooltip="Open in editor"
					kind="ghost"
					onclick={() => onOpenInEditor(content)}
				/>
			{/if}
			{#if onPin}
				<Button
					icon="tag"
					tooltip={isPinned ? "Unpin message" : "Pin message"}
					kind="ghost"
					onclick={() => onPin(content)}
				/>
			{/if}
			{#if onCreateBranch}
				<Button
					icon="branch"
					tooltip="Create branch from this response"
					kind="ghost"
					onclick={() => onCreateBranch(content || "")}
				/>
			{/if}
			{#if shouldShowNextPhaseButton && onCreateNextPhaseBranch && nextPhase}
				<Button
					icon="arrow-right"
					tooltip={`Create next phase branch: ${PHASES.find((p) => p.value === nextPhase)?.name}`}
					kind="solid"
					onclick={() => onCreateNextPhaseBranch(content || "")}
				>
					Create next phase branch
				</Button>
			{/if}
		</div>
	</div>
{/if}

<style lang="postcss">
	.message-assistant {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: var(--message-max-width);
		padding: 8px 0;
		overflow: hidden;
		gap: 10px;
		text-wrap: wrap;
		word-break: break-word;
	}
	.message-assistant__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		align-items: center;
	}
	.message-assistant__actions-copy,
	.message-assistant__feedback {
		display: flex;
		gap: 4px;
	}
	:global(.message-assistant .markdown > *) {
		/** With padding block quote background can still be full width. */
		padding-right: 32px;
	}
</style>
