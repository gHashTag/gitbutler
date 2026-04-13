<script lang="ts">
	import AddedDirectories from "$components/codegen/AddedDirectories.svelte";
	import ClaudeCheck from "$components/codegen/ClaudeCheck.svelte";
	import ClaudeUnavailableBanner from "$components/codegen/ClaudeUnavailableBanner.svelte";
	import CodegenAskUserQuestion from "$components/codegen/CodegenAskUserQuestion.svelte";
	import CodegenChatClaudeNotRegistered from "$components/codegen/CodegenChatClaudeNotRegistered.svelte";
	import CodegenInput from "$components/codegen/CodegenInput.svelte";
	import CodegenMessageItem from "$components/codegen/CodegenMessageItem.svelte";
	import ProjectRules from "$components/codegen/ProjectRules.svelte";
	import CodegenPromptConfigModal from "$components/codegen/CodegenPromptConfigModal.svelte";
	import CodegenServiceMessageThinking from "$components/codegen/CodegenServiceMessageThinking.svelte";
	import CodegenServiceMessageUseTool from "$components/codegen/CodegenServiceMessageUseTool.svelte";
	import CodegenTodoAccordion from "$components/codegen/CodegenTodoAccordion.svelte";
	import AppScrollableContainer from "$components/shared/AppScrollableContainer.svelte";
	import DrawerHeader from "$components/shared/DrawerHeader.svelte";
	import ErrorBoundary from "$components/shared/ErrorBoundary.svelte";
	import ReduxResult from "$components/shared/ReduxResult.svelte";
	import noClaudeCodeSvg from "$lib/assets/empty-state/claude-disconected.svg?raw";
	import laneNewSvg from "$lib/assets/empty-state/lane-new.svg?raw";
	import { BACKEND } from "$lib/backend";
	import { getEditorUri, URL_SERVICE } from "$lib/backend/url";
	import { ATTACHMENT_SERVICE } from "$lib/codegen/attachmentService.svelte";
	import { CLIPBOARD_SERVICE } from "$lib/backend/clipboard";
	import { CLAUDE_CODE_SERVICE } from "$lib/codegen/claude";
	import { MessageSender } from "$lib/codegen/messageQueue.svelte";
	import type { PromptAttachment } from "$lib/codegen/types";
	import {
		currentStatus,
		thinkingOrCompactingStartedAt,
		userFeedbackStatus,
		usageStats,
		formatMessages,
		getTodos,
		type Message,
	} from "$lib/codegen/messages";
	import { parseTemplates } from "$lib/codegen/templateParser";
	import { splitMessage } from "$lib/commits/commitMessage";
	import { formatRingNumber, getNextPhase, isRingBranch, parseRingNumber, parsePhaseSuffix, PHASE_ORDER } from "$lib/utils/phiLoop";
	import { UI_STATE } from "$lib/state/uiState.svelte";

	import { RULES_SERVICE } from "$lib/rules/rulesService.svelte";
	import { SETTINGS_SERVICE } from "$lib/settings/appSettings";
	import { SETTINGS } from "$lib/settings/userSettings";
	import { getStackContext } from "$lib/stacks/stackController.svelte";
	import { formatCompactNumber } from "$lib/utils/number";
	import { inject } from "@gitbutler/core/context";
	import { reactive } from "@gitbutler/shared/reactiveUtils.svelte";
	import {
		Button,
		ContextMenu,
		ContextMenuItem,
		ContextMenuSection,
		EmptyStatePlaceholder,
		KebabButton,
		Modal,
		Tooltip,
		Link,
		SkeletonBone,
	} from "@gitbutler/ui";
	import { showToast } from "$lib/notifications/toasts";

	import VirtualList from "@gitbutler/ui/components/VirtualList.svelte";
	import { focusable } from "@gitbutler/ui/focus/focusable";
	import type {
		ThinkingLevel,
		ModelType,
		PermissionMode,
		PermissionDecision,
	} from "$lib/codegen/types";

	type Props = {
		hasRulesToClear?: boolean;
		projectRegistered?: boolean;
		onclose?: () => void;
		onMcpSettings?: () => void;
	};
	const { hasRulesToClear, projectRegistered, onclose, onMcpSettings }: Props = $props();

	const controller = getStackContext();
	const projectId = $derived(controller.projectId);
	const stackId = $derived(controller.stackId);

	const branchName = $derived(controller.branchName ?? "");

	// Extract ring number from branch name for ring-NNN-* pattern (without leading zeros)
	const ringNumber = $derived.by(() => parseRingNumber(branchName));

	const backend = inject(BACKEND);
	const claudeCodeService = inject(CLAUDE_CODE_SERVICE);
	const clipboardService = inject(CLIPBOARD_SERVICE);
	const rulesService = inject(RULES_SERVICE);
	const urlService = inject(URL_SERVICE);
	const userSettings = inject(SETTINGS);
	const settingsService = inject(SETTINGS_SERVICE);
	const attachmentService = inject(ATTACHMENT_SERVICE);
	const uiState = inject(UI_STATE);
	const claudeSettings = $derived($settingsService?.claude);

	const isStackActiveQuery = $derived(claudeCodeService.isStackActive(projectId, stackId));
	const isStackActive = $derived(isStackActiveQuery?.response || false);
	const eventsQuery = $derived(claudeCodeService.messages({ projectId, stackId }));
	const events = $derived(eventsQuery.response || []);
	const sessionIdQuery = $derived(rulesService.aiSessionId(projectId, stackId));
	const sessionId = $derived(sessionIdQuery.response);
	const permissionRequestsQuery = $derived(claudeCodeService.permissionRequests({ projectId }));
	const permissionRequests = $derived(permissionRequestsQuery.response || []);
	const attachments = $derived(attachmentService.getByBranch(branchName));

	const claudeAvailable = $derived(claudeCodeService.checkAvailable(undefined));
	const canEnterChat = $derived(!!projectRegistered);

	let clearContextModal = $state<Modal>();
	let modelContextMenu = $state<ContextMenu>();
	let modelTrigger = $state<HTMLButtonElement>();
	let thinkingModeContextMenu = $state<ContextMenu>();
	let thinkingModeTrigger = $state<HTMLButtonElement>();
	let permissionModeContextMenu = $state<ContextMenu>();
	let permissionModeTrigger = $state<HTMLButtonElement>();
	let templateContextMenu = $state<ContextMenu>();
	let templateTrigger = $state<HTMLButtonElement>();

	let promptConfigModal = $state<CodegenPromptConfigModal>();
	let virtualList = $state<VirtualList<Message>>();
	let inputRef = $state<CodegenInput>();
	let dismissedAskUserQuestions = $state<Record<string, boolean>>({});

	// Track expanded state for tool calls by message createdAt timestamp
	const toolCallExpandedState = {
		groups: new Map<string, boolean>(),
		individual: new Map<string, boolean>(),
	};

	const modelOptions: { label: string; value: ModelType }[] = [
		{ label: "Haiku", value: "haiku" },
		{ label: "Sonnet", value: "sonnet" },
		{ label: "Sonnet 1m", value: "sonnet[1m]" },
		{ label: "Opus", value: "opus" },
		{ label: "Opus Planning", value: "opusplan" },
	];

	const thinkingLevels: { label: string; shortLabel: string; value: ThinkingLevel }[] = [
		{ label: "Normal", shortLabel: "Normal", value: "normal" },
		{ label: "Think", shortLabel: "Think", value: "think" },
		{ label: "Mega think", shortLabel: "Mega", value: "megaThink" },
		{ label: "Ultra think", shortLabel: "Ultra", value: "ultraThink" },
	];

	const permissionModeOptions: { label: string; value: PermissionMode }[] = [
		{ label: "Edit with permission", value: "default" },
		{ label: "Planning", value: "plan" },
		{ label: "Accept edits", value: "acceptEdits" },
	];

	const promptTemplates = $derived(claudeCodeService.promptTemplates(projectId));
	const promptDirs = $derived(claudeCodeService.promptDirs(projectId));

	// Parse templates once and cache the results
	const parsedTemplates = $derived(
		promptTemplates.response ? parseTemplates(promptTemplates.response) : [],
	);

	async function openPromptConfigDir(path: string) {
		await claudeCodeService.createPromptDir({ projectId, path });

		const editorUri = getEditorUri({
			schemeId: $userSettings.defaultCodeEditor.schemeIdentifer,
			path: [path],
			searchParams: { windowId: "_blank" },
		});

		urlService.openExternalUrl(editorUri);
	}

	const selectedThinkingLevel = $derived(controller.projectState.thinkingLevel.current);
	const selectedModel = $derived(controller.projectState.selectedModel.current);
	const selectedPermissionMode = $derived(controller.laneState.permissionMode.current);

	const messageSender = $derived(
		stackId && branchName
			? new MessageSender({
					projectId: reactive(() => projectId),
					selectedBranch: reactive(() => ({
						stackId: stackId!,
						head: branchName!,
					})),
					thinkingLevel: reactive(() => selectedThinkingLevel),
					model: reactive(() => selectedModel),
					permissionMode: reactive(() => selectedPermissionMode),
				})
			: undefined,
	);
	const initialPrompt = $derived(messageSender?.prompt);

	async function onPermissionDecision(
		id: string,
		decision: PermissionDecision,
		useWildcard: boolean,
	) {
		await claudeCodeService.updatePermissionRequest({
			projectId,
			requestId: id,
			decision,
			useWildcard,
		});
	}

	function selectModel(model: ModelType) {
		controller.projectState.selectedModel.set(model);
		modelContextMenu?.close();
	}

	function selectThinkingLevel(level: ThinkingLevel) {
		controller.projectState.thinkingLevel.set(level);
		thinkingModeContextMenu?.close();
	}

	function selectPermissionMode(mode: PermissionMode) {
		controller.laneState.permissionMode.set(mode);
		permissionModeContextMenu?.close();
	}

	function getPermissionModeIcon(
		mode: PermissionMode,
	): "edit-shield" | "checklist" | "tick-double" {
		switch (mode) {
			case "default":
				return "edit-shield";
			case "plan":
				return "checklist";
			case "acceptEdits":
				return "tick-double";
			default:
				return "edit-shield";
		}
	}

	function thinkingLevelToUiLabel(level: ThinkingLevel, short: boolean = false): string {
		const thinkingLevel = thinkingLevels.find((t) => t.value === level);
		if (!thinkingLevel) return "Normal";
		return short ? thinkingLevel.shortLabel : thinkingLevel.label;
	}

	async function insertTemplate(templateContent: string) {
		const currentPrompt = await inputRef?.getText();
		const newPrompt = currentPrompt + (currentPrompt ? "\n\n" : "") + templateContent;
		messageSender?.setPrompt(newPrompt);
		inputRef?.setText(newPrompt);
		templateContextMenu?.close();
	}

	async function onAbort() {
		if (stackId) {
			await claudeCodeService.cancelSession({ projectId, stackId });
		}
	}

	async function sendMessage(prompt: string) {
		await messageSender?.sendMessage(prompt, attachments);
		attachmentService.clearByBranch(branchName);
	}

	async function handleAnswerQuestion(answers: Record<string, string>) {
		if (!stackId) return;
		await claudeCodeService.answerAskUserQuestion({ projectId, stackId, answers });
	}

	async function insertIntoCommitMessage(content: string) {
		const laneState = uiState.lane(stackId || "codegen--new-lane");

		// Parse AI response into title and description
		const message = splitMessage(content);

		// Update the commit message state
		laneState.newCommitMessage.update({
			title: message.title,
			description: message.description,
		});
	}

	// Track pinned messages (simple local state)
	let pinnedMessages = $state<Set<string>>(new Set());

	function togglePin(content: string) {
		if (pinnedMessages.has(content)) {
			pinnedMessages.delete(content);
		} else {
			pinnedMessages.add(content);
		}
	}

	async function regenerateMessage() {
		// Find the last user message and regenerate the AI response
		const userMessages = events
			.filter((e) => e.payload.source === "user")
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		if (userMessages.length === 0) {
			showToast({ message: "No message to regenerate", style: "danger" });
			return;
		}

		const lastUserMessage = userMessages[userMessages.length - 1];
		if (!lastUserMessage) return;
		const userInput = lastUserMessage.payload as { source: "user"; message: string; attachments?: PromptAttachment[] };
		await messageSender?.sendMessage(userInput.message, attachments);
	}

	async function handleFeedback(feedback: "up" | "down") {
		// Save to T27 PHI LOOP experience
		try {
			const trinityPath = `${import.meta.env.VITE_TRINITY_HOME || process.env.TRINITY_HOME || "~/.trinity"}/experience/episodes.jsonl`;
			const lastClaudeMessage = formattedMessages
				.filter((m) => m.source === "claude")
				.slice(-1)[0];
			// formattedMessages have the source at the top level (not in payload)
			const messageContent = (lastClaudeMessage as { source: "claude"; message: string } | undefined)?.message || "";
			await fetch(trinityPath, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
						timestamp: new Date().toISOString(),
						type: "claude-code-chat-feedback",
						data: {
								feedback,
								message: messageContent,
						},
				}),
			});
		} catch (err) {
			console.error("Failed to save feedback:", err);
		}
	}

	async function exportToMarkdown(content: string) {
		// Download content as .md file using browser API
		const fileName = `ring-${Date.now()}-spec.md`;
		try {
			const blob = new Blob([content], { type: "text/markdown" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			showToast({ message: "Failed to export", style: "danger" });
		}
	}

	async function openInEditor(content: string) {
		// Copy to clipboard and notify user to paste in editor
		try {
			await clipboardService.write(content, { message: "Copied to clipboard - paste in editor" });
		} catch (err) {
			showToast({ message: "Failed to copy", style: "danger" });
		}
	}

	async function createBranchFromResponse(content: string) {
		// Parse ring number from AI response (looks for "ring-NNN" pattern)
		const ringNum = parseRingNumber(content);
		const paddedRingNum = ringNum ? formatRingNumber(ringNum) : Date.now().toString();
		const newBranchName = ringNum
			? `ring-${paddedRingNum}-spec`
			: `ring-${paddedRingNum}-spec`;

		try {
			await backend.invoke("create_virtual_branch", {
				projectId,
				branch: { name: newBranchName }
			});
			showToast({ message: `Branch ${newBranchName} created`, style: "success" });
		} catch (err) {
			showToast({ message: "Failed to create branch", style: "danger" });
		}
	}

	async function createNextPhaseBranch(content: string) {
		// Check if this is a ring branch
		if (!isRingBranch(branchName)) {
			showToast({ message: "Not a ring branch", style: "danger" });
			return;
		}

		// Extract current ring number and phase from current branch
		const ringNum = parseRingNumber(branchName);
		const currentPhase = parsePhaseSuffix(branchName);

		if (!ringNum || !currentPhase) {
			showToast({ message: "Invalid ring branch format", style: "danger" });
			return;
		}

		const nextPhase = getNextPhase(currentPhase);
		if (!nextPhase) {
			showToast({ message: "No next phase available", style: "danger" });
			return;
		}

		const paddedRingNum = formatRingNumber(ringNum);
		const newBranchName = `ring-${paddedRingNum}-${nextPhase}`;

		try {
			await backend.invoke("create_virtual_branch", {
				projectId,
				branch: { name: newBranchName }
			});
			showToast({ message: `Branch ${newBranchName} created`, style: "success" });
		} catch (err) {
			showToast({ message: "Failed to create next phase branch", style: "danger" });
		}
	}

	async function retryConfig() {
		await claudeCodeService.fetchClaudeConfig({ projectId }, { forceRefetch: true });
	}

	function clearContextAndRules() {
		clearContextModal?.show();
	}

	async function compactContext() {
		await claudeCodeService.compactHistory({
			projectId,
			stackId,
		});
	}

	async function performClearContextAndRules() {
		if (!sessionId) return;
		const rules = await rulesService.fetchListWorkspaceRules(projectId);
		const toDelete = rules.filter((rule) =>
			rule.filters.some(
				(filter) => filter.type === "claudeCodeSessionId" && filter.subject === sessionId,
			),
		);

		for (const rule of toDelete) {
			await rulesService.deleteWorkspaceRuleMutate({
				projectId,
				ruleId: rule.id,
			});
		}
	}

	const formattedMessages = $derived(formatMessages(events, permissionRequests, isStackActive));

	$effect(() => {
		const activeIds = new Set(
			formattedMessages.flatMap((message) =>
				message.source === "claude" && "subtype" in message && message.subtype === "askUserQuestion"
					? [message.toolUseId]
					: [],
			),
		);
		let changed = false;
		for (const id of Object.keys(dismissedAskUserQuestions)) {
			if (!activeIds.has(id)) {
				delete dismissedAskUserQuestions[id];
				changed = true;
			}
		}
		if (changed) {
			dismissedAskUserQuestions = { ...dismissedAskUserQuestions };
		}
	});
	const pendingAskUserQuestion = $derived.by(() => {
		for (let i = formattedMessages.length - 1; i >= 0; i -= 1) {
			const message = formattedMessages[i];
			if (
				message?.source === "claude" &&
				"subtype" in message &&
				message.subtype === "askUserQuestion" &&
				!message.answered &&
				!dismissedAskUserQuestions[message.toolUseId]
			) {
				return message;
			}
		}
		return undefined;
	});
	const messagesForList = $derived.by(() =>
		formattedMessages.filter((message) => {
			if (message.source !== "claude" || !("subtype" in message)) {
				return true;
			}
			return message.subtype !== "askUserQuestion" || message.answered;
		}),
	);
</script>

<div class="chat" use:focusable={{ vertical: true }}>
	<ErrorBoundary title="Something went wrong in the chat">
		<ReduxResult result={claudeAvailable.result}>
			{#snippet loading()}
				<DrawerHeader {onclose}>
					{#snippet content()}
						<div class="chat-header-content">
							<h3 class="text-14 text-semibold truncate">Chat for {branchName}</h3>
							{#if ringNumber}
								<span class="ring-badge">Ring {ringNumber}</span>
							{/if}
						</div>
					{/snippet}
					{#snippet actions()}
						<div class="flex gap-4 items-center">
							<SkeletonBone width="2.5rem" height="1.2rem" />
							<SkeletonBone width="1.5rem" height="1.2rem" />
						</div>
					{/snippet}
				</DrawerHeader>

				<div class="chat-skeleton">
					<div class="chat-skeleton__user">
						<SkeletonBone
							width="80%"
							height="3rem"
							color="var(--bg-3)"
							opacity={0.4}
							radius="var(--radius-ml) var(--radius-ml) 0 var(--radius-ml)"
						/>
					</div>
					<div class="chat-skeleton__assistant">
						<SkeletonBone width="100%" height="1rem" />
						<SkeletonBone width="90%" height="1rem" />
						<SkeletonBone width="95%" height="1rem" />
					</div>
					<div class="chat-skeleton__user">
						<SkeletonBone
							width="50%"
							height="3rem"
							color="var(--bg-3)"
							opacity={0.4}
							radius="var(--radius-ml) var(--radius-ml) 0 var(--radius-ml)"
						/>
					</div>
					<div class="chat-skeleton__assistant">
						<SkeletonBone width="90%" height="1rem" />
						<SkeletonBone width="70%" height="1rem" />
					</div>
				</div>

				<div class="dialog-wrapper">
					<div class="input-skeleton">
						<div class="input-skeleton__text"><SkeletonBone width="60%" height="1rem" /></div>
						<div class="input-skeleton__actions">
							<SkeletonBone
								width="4rem"
								height="var(--size-button)"
								radius="var(--radius-button)"
							/>
							<div class="flex gap-8">
								<SkeletonBone
									width="4rem"
									height="var(--size-button)"
									radius="var(--radius-button)"
								/>
								<SkeletonBone
									width="calc(var(--size-button) + 0.188rem)"
									height="var(--size-button)"
									color="var(--fill-pop-bg)"
									radius="var(--radius-button)"
								/>
							</div>
						</div>
					</div>
				</div>
			{/snippet}
			{#snippet children(claudeAvailable)}
				{@const todos = getTodos(events)}

				<!-- TODO: remove this header when we move to the workspace layout -->
				<DrawerHeader {onclose}>
					{#snippet content()}
						<div class="chat-header-content">
							<h3 class="text-14 text-semibold truncate">Chat for {branchName}</h3>
							{#if ringNumber}
								<span class="ring-badge">Ring {ringNumber}</span>
							{/if}
						</div>
					{/snippet}

					{#snippet actions()}
						{@const stats = usageStats(events)}
						{@const contextUsage = Math.round(stats.contextUtilization * 100)}

						<div class="flex gap-10 items-center">
							{#if stats.tokens > 0}
								<Tooltip text="Tokens: {stats.tokens.toLocaleString()} / ${stats.cost.toFixed(2)}">
									<span class="text-12 clr-text-2">
										{formatCompactNumber(stats.tokens)}
									</span>
								</Tooltip>

								<Tooltip text="{contextUsage}% context used">
									<div
										class="context-utilization-scale"
										style="--context-utilization: {contextUsage}"
									>
										<svg viewBox="0 0 17 17">
											<circle class="bg-circle" cx="8.5" cy="8.5" r="6.5" />
											<circle class="progress-circle" cx="8.5" cy="8.5" r="6.5" />
										</svg>
									</div>
								</Tooltip>
							{/if}

							<KebabButton>
								{#snippet contextMenu({ close })}
									{@const isDisabled =
										!hasRulesToClear ||
										!events ||
										events.length === 0 ||
										["running", "compacting"].includes(currentStatus(events, isStackActive))}

									{#if onMcpSettings}
										<ContextMenuSection>
											<ContextMenuItem
												label="MCP settings"
												icon="mcp"
												onclick={() => {
													onMcpSettings?.();
													close();
												}}
											/>
										</ContextMenuSection>
									{/if}
									<ContextMenuSection>
										<ContextMenuItem
											label="Clear context"
											icon="eraser"
											disabled={isDisabled}
											onclick={() => {
												clearContextAndRules();
												close();
											}}
										/>
										<ContextMenuItem
											label="Compact context"
											icon="compact"
											disabled={isDisabled}
											onclick={() => {
												compactContext();
												close();
											}}
										/>
									</ContextMenuSection>
								{/snippet}
							</KebabButton>
						</div>
					{/snippet}
				</DrawerHeader>

				<div class="chat-container">
					{#if ringNumber}
						<div class="ring-context">
							<span class="ring-context__text">Active Ring: {ringNumber} | t27 PHI LOOP active</span>
						</div>
					{/if}
					<ProjectRules {projectId} />
					{#if claudeAvailable.status !== "available" && formattedMessages.length === 0}
						<AppScrollableContainer childrenWrapDisplay="contents">
							<div class="no-agent-placeholder">
								<div class="no-agent-placeholder__content">
									{@html noClaudeCodeSvg}
									<h2 class="text-serif-42">Connect Claude Code</h2>
									<p class="text-13 text-body clr-text-2">
										<br />
										Click the button below to check if Claude Code is now available.
									</p>

									<ClaudeCheck />
								</div>

								<p class="text-12 text-body clr-text-2">
									Having trouble connecting?
									<br />
									Check the <Link href="https://docs.claude.com/en/docs/claude-code/troubleshooting"
										>troubleshooting guide</Link
									> for common issues and solutions.
								</p>
							</div>
						</AppScrollableContainer>
					{:else if !isStackActive && formattedMessages.length === 0}
						<div class="chat-view__placeholder">
							<EmptyStatePlaceholder
								image={laneNewSvg}
								width={320}
								topBottomPadding={0}
								bottomMargin={0}
							>
								{#snippet title()}
									Let's build something amazing
								{/snippet}
								{#snippet caption()}
									{#if canEnterChat}
										Your canvas is clear
										<br />
										Let the code take shape
									{:else}
										Run `claude` once
										<br />
										to initialise the chat
									{/if}
								{/snippet}
							</EmptyStatePlaceholder>
						</div>
					{:else}
						<VirtualList
							bind:this={virtualList}
							grow
							stickToBottom
							showBottomButton
							items={messagesForList}
							visibility={$userSettings.scrollbarVisibilityState}
							padding={{ left: 20, right: 20, top: 12, bottom: 12 }}
							defaultHeight={65}
							getId={(item) => item.createdAt}
						>
							{#snippet template(message)}
								<CodegenMessageItem
									{projectId}
									{message}
									{onPermissionDecision}
									{toolCallExpandedState}
									onInsertIntoCommitMessage={insertIntoCommitMessage}
									onRegenerate={regenerateMessage}
									onFeedback={handleFeedback}
									onExport={exportToMarkdown}
									onOpenInEditor={openInEditor}
									onPin={togglePin}
									onCreateBranch={createBranchFromResponse}
									onCreateNextPhaseBranch={createNextPhaseBranch}
									{branchName}
									isPinned={
										"contentBlocks" in message
											? pinnedMessages.has(
													JSON.stringify(
															message.contentBlocks.find(
																	(b): b is { type: "text"; text: string } => b.type === "text"
															)?.text || ""
													)
												)
											: false
									}
								/>
							{/snippet}
							{@const thinkingStatus = currentStatus(events, isStackActive)}
							{@const startAt = thinkingOrCompactingStartedAt(events)}
							{#if ["running", "compacting"].includes(thinkingStatus) && startAt}
								{@const status = userFeedbackStatus(formattedMessages)}
								{#if status.waitingForFeedback}
									<CodegenServiceMessageUseTool toolCall={status.toolCall} />
								{:else if !pendingAskUserQuestion}
									<CodegenServiceMessageThinking
										{startAt}
										msSpentWaiting={status.msSpentWaiting}
										overrideWord={thinkingStatus === "compacting" ? "compacting" : undefined}
									/>
								{/if}
							{/if}
						</VirtualList>
					{/if}
					{#if todos.length > 0}
						<CodegenTodoAccordion {todos} />
					{/if}
				</div>
				{#if claudeAvailable.status !== "available"}
					{#if formattedMessages.length > 0}
						<ClaudeUnavailableBanner
							onSettingsBtnClick={() => {
								controller.openProjectSettingsModal("agent");
							}}
						/>
					{/if}
				{:else if !projectRegistered}
					{#if formattedMessages.length > 0}
						<CodegenChatClaudeNotRegistered onRetryConfig={retryConfig} />
					{/if}
				{:else}
					{@const status = currentStatus(events, isStackActive)}
					{@const addedDirs = controller.laneState.addedDirs.current}

					<div class="dialog-wrapper">
						{#if pendingAskUserQuestion}
							<CodegenAskUserQuestion
								questions={pendingAskUserQuestion.questions}
								answered={pendingAskUserQuestion.answered}
								onSubmitAnswers={async (answers) => {
									await handleAnswerQuestion(answers);
								}}
								onCancel={async () => {
									dismissedAskUserQuestions = {
										...dismissedAskUserQuestions,
										[pendingAskUserQuestion.toolUseId]: true,
									};
									await onAbort();
								}}
							/>
						{:else}
							<AddedDirectories
								{addedDirs}
								onRemoveDir={(dir) => {
									controller.laneState.addedDirs.remove(dir);
								}}
							/>

							<CodegenInput
								bind:this={inputRef}
								{projectId}
								{stackId}
								{branchName}
								value={initialPrompt || ""}
								loading={["running", "compacting"].includes(status)}
								compacting={status === "compacting"}
								onChange={(prompt) => messageSender?.setPrompt(prompt)}
								onSubmit={async (prompt) => {
									await sendMessage(prompt);
									setTimeout(() => {
										virtualList?.scrollToBottom();
									}, 100);
								}}
								{onAbort}
								onCancel={onclose}
							>
								{#snippet actionsOnLeft()}
									{@const permissionModeLabel = permissionModeOptions.find(
										(a) => a.value === selectedPermissionMode,
									)?.label}

									<div class="flex m-right-4 gap-2">
										<Button
											bind:el={templateTrigger}
											kind="ghost"
											icon="script"
											tooltip="Insert template"
											onclick={(e) => templateContextMenu?.toggle(e)}
										/>
										<Button
											bind:el={thinkingModeTrigger}
											kind="ghost"
											icon="thinking"
											reversedDirection
											onclick={() => thinkingModeContextMenu?.toggle()}
											tooltip="Thinking mode"
											children={selectedThinkingLevel === "normal" ? undefined : thinkingBtnText}
										/>
										<Button
											bind:el={permissionModeTrigger}
											kind="ghost"
											icon={getPermissionModeIcon(selectedPermissionMode)}
											shrinkable
											onclick={() => permissionModeContextMenu?.toggle()}
											tooltip={$settingsService?.claude.dangerouslyAllowAllPermissions
												? "Permission modes disable when all permissions are allowed"
												: permissionModeLabel}
											disabled={$settingsService?.claude.dangerouslyAllowAllPermissions}
										/>
									</div>
								{/snippet}

								{#snippet actionsOnRight()}
									{#if !claudeSettings?.useConfiguredModel}
										<Button
											bind:el={modelTrigger}
											kind="ghost"
											icon="chevron-down"
											shrinkable
											onclick={() => modelContextMenu?.toggle()}
										>
											{modelOptions.find((a) => a.value === selectedModel)?.label}
										</Button>
									{/if}
								{/snippet}
							</CodegenInput>
						{/if}
					</div>
				{/if}
			{/snippet}
		</ReduxResult>
	</ErrorBoundary>
</div>

{#snippet thinkingBtnText()}
	{thinkingLevelToUiLabel(selectedThinkingLevel, true)}
{/snippet}

<Modal
	bind:this={clearContextModal}
	width="small"
	type="warning"
	title="Clear context"
	onSubmit={async (close) => {
		await performClearContextAndRules();
		close();
	}}
>
	Are you sure you want to clear the context and delete all rules associated with this Claude
	session? This action cannot be undone.

	{#snippet controls(close)}
		<Button kind="outline" onclick={close}>Cancel</Button>
		<Button style="danger" type="submit">Clear context</Button>
	{/snippet}
</Modal>

<ContextMenu bind:this={modelContextMenu} leftClickTrigger={modelTrigger} side="top" align="end">
	<ContextMenuSection>
		{#each modelOptions as option}
			<ContextMenuItem
				label={option.label}
				selected={selectedModel === option.value}
				onclick={() => selectModel(option.value)}
			/>
		{/each}
	</ContextMenuSection>
</ContextMenu>

<ContextMenu
	bind:this={thinkingModeContextMenu}
	leftClickTrigger={thinkingModeTrigger}
	align="start"
	side="top"
>
	<ContextMenuSection>
		{#each thinkingLevels as level}
			<ContextMenuItem
				label={level.label}
				selected={selectedThinkingLevel === level.value}
				onclick={() => selectThinkingLevel(level.value)}
			/>
		{/each}
	</ContextMenuSection>
</ContextMenu>

<ContextMenu
	bind:this={permissionModeContextMenu}
	leftClickTrigger={permissionModeTrigger}
	align="start"
	side="top"
>
	<ContextMenuSection>
		{#each permissionModeOptions as option}
			<ContextMenuItem
				label={option.label}
				selected={selectedPermissionMode === option.value}
				onclick={() => selectPermissionMode(option.value)}
			/>
		{/each}
	</ContextMenuSection>
</ContextMenu>

<ContextMenu
	bind:this={templateContextMenu}
	leftClickTrigger={templateTrigger}
	side="top"
	align="start"
>
	<ContextMenuSection>
		<ReduxResult result={promptTemplates.result} {projectId}>
			{#snippet children(_promptTemplates, { projectId: _projectId })}
				{#each parsedTemplates as template}
					{@const displayName = template.parsed.name || template.fileName}

					<ContextMenuItem
						label={displayName}
						emoji={template.parsed.emoji || undefined}
						icon={template.parsed.emoji ? undefined : "script"}
						onclick={() => {
							insertTemplate(template.parsed.content);
						}}
					/>
				{/each}
			{/snippet}
		</ReduxResult>
	</ContextMenuSection>
	<ContextMenuSection>
		<ContextMenuItem
			label="Edit templates…"
			icon="edit"
			onclick={() => {
				promptConfigModal?.show();
				templateContextMenu?.close();
			}}
		/>
	</ContextMenuSection>
</ContextMenu>

{#if promptDirs.response}
	<CodegenPromptConfigModal
		bind:this={promptConfigModal}
		promptDirs={promptDirs.response}
		{openPromptConfigDir}
	/>
{/if}

<style lang="postcss">
	.chat {
		container-name: chat;
		container-type: inline-size;
		display: flex;
		position: relative;
		flex: 1;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.chat-container {
		--message-max-width: 840px;
		display: flex;
		position: relative;
		flex: 1;
		flex-grow: 1;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 10rem;
		overflow: hidden;
	}

	.ring-context {
		padding: 8px 20px;
		background: var(--bg-1);
		border-bottom: 1px solid var(--border-2);
	}

	.ring-context__text {
		font-size: 11px;
		color: var(--text-3);
	}
	.chat-view__placeholder {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 28px;
	}

	.dialog-wrapper {
		display: flex;
		position: relative;
		flex-shrink: 0;
		flex-direction: column;
		width: 100%;
		padding: 16px;
		gap: 8px;
		border-top: 1px solid var(--border-2);
	}

	.no-agent-placeholder {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		margin: 40px 0;
		padding: 0 40px;
	}

	.no-agent-placeholder__content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100%;
		margin-bottom: 32px;
		gap: 18px;
	}

	.context-utilization-scale {
		position: relative;
		width: 17px;
		height: 17px;
		transform: rotate(-90deg);

		& svg {
			width: 100%;
			height: 100%;
		}

		& circle {
			fill: none;
			stroke-linecap: round;
			stroke-width: 2;
		}

		& .bg-circle {
			stroke: color-mix(in srgb, var(--text-2), transparent 85%);
		}

		& .progress-circle {
			stroke: var(--text-2);
			stroke-dasharray: calc(3.14159 * 13);
			stroke-dashoffset: calc(3.14159 * 13 * (1 - var(--context-utilization) / 100));
			transition: stroke-dashoffset 0.3s ease;
		}
	}

	.chat-skeleton {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 20px;
		gap: 20px;
	}

	.chat-skeleton__user {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
	}

	.chat-skeleton__assistant {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: 80%;
		gap: 8px;
	}

	.input-skeleton {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 12px;
		border: 1px solid var(--border-2);
		border-radius: var(--radius-m);
	}

	.input-skeleton__text {
		width: 100%;
		padding-bottom: 30px;
	}

	.input-skeleton__actions {
		display: flex;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid var(--border-3);
	}

	.chat-header-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ring-badge {
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 10px;
		background: var(--bg-2);
		color: var(--text-2);
		font-weight: 500;
		white-space: nowrap;
	}
</style>
