/**
 * Wave 5: Agent Response Parser
 * Splits AI responses into reasoning and actions for dual-pane view
 */

export interface ParsedResponse {
  reasoning: string;
  actions: Action[];
  raw: string;
}

export interface Action {
  type: 'bash' | 'file-create' | 'file-modify' | 'file-read' | 'branch-create' | 'commit' | 'tool';
  command?: string;
  path?: string;
  content?: string;
  line?: number;
  timestamp?: string;
}

// Patterns for detecting different action types
const PATTERNS = {
  // Thinking/reasoning patterns
  thinking: [
    /^(Let me|I'll|I need to|First,|Now,|Looking at|Checking|Analyzing|Reading|Writing|Creating|Based on)/m,
    /^(To|For|Since|Given|Considering|Looking at)/m,
    /^(I'll check|Let me examine|I can see|I notice)/m,
    /^(Hmm|Interesting|Good|Great|Excellent|Perfect)/m,
  ],

  // Code blocks
  bashCode: /```bash\n([\s\S]*?)```/g,
  tsCode: /```(?:typescript|ts)\n([\s\S]*?)```/g,
  genericCode: /```\w*\n([\s\S]*?)```/g,

  // File operations
  fileCreate: /(?:Created|Wrote|Added) file:?\s*(.+)/i,
  fileModify: /(?:Modified|Updated|Changed|Edited):\s*(.+)/i,
  fileRead: /(?:Read|Reading):\s*(.+)/i,

  // Git/Branch operations
  branchCreate: /(?:Created|Created branch|Switched to):\s*(.+)/i,
  commit: /(?:Committed|Git commit|Created commit):\s*(.+)/i,

  // Tool usage
  toolUse: /(?:Used|Called|Invoked):\s*(.+?)\n/i,
};

/**
 * Extract reasoning from response
 */
function extractReasoning(text: string): string {
  const lines = text.split('\n');
  const reasoningLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip code blocks
    if (trimmed.startsWith('```')) continue;

    // Skip action indicators
    if (/^(→|✓|✗|✔|❌|▶|⚠|⚡|🔧|📝|💡)/.test(trimmed)) continue;

    // Skip file operation lines
    if (PATTERNS.fileCreate.test(trimmed) ||
        PATTERNS.fileModify.test(trimmed) ||
        PATTERNS.fileRead.test(trimmed)) continue;

    // Check if this is a thinking/reasoning line
    const isThinking = PATTERNS.thinking.some(pattern => pattern.test(trimmed));

    // Also include sentences that are clearly reasoning
    const isSentence = /[.!?]$/.test(trimmed);
    const isQuestion = /\?$/.test(trimmed);
    const isStatement = /^(I|The|This|That|We|You|It|They|So|Therefore|Thus|Hence|As)/.test(trimmed);

    if (isThinking || (isSentence || isQuestion) && !PATTERNS.genericCode.test(line)) {
      reasoningLines.push(line);
    }
  }

  return reasoningLines.join('\n');
}

/**
 * Extract bash commands from code blocks
 */
function extractBashCommands(text: string): Action[] {
  const actions: Action[] = [];
  let match;

  while ((match = PATTERNS.bashCode.exec(text)) !== null) {
    const command = match[1]?.trim();
    if (command) {
      actions.push({
        type: 'bash',
        command,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return actions;
}

/**
 * Extract file operations
 */
function extractFileOperations(text: string): Action[] {
  const actions: Action[] = [];

  // File creates
  let match;
  while ((match = PATTERNS.fileCreate.exec(text)) !== null) {
    actions.push({
      type: 'file-create',
      path: match[1]?.trim() || '',
      timestamp: new Date().toISOString(),
    });
  }

  // File modifications
  while ((match = PATTERNS.fileModify.exec(text)) !== null) {
    actions.push({
      type: 'file-modify',
      path: match[1]?.trim() || '',
      timestamp: new Date().toISOString(),
    });
  }

  // File reads
  while ((match = PATTERNS.fileRead.exec(text)) !== null) {
    actions.push({
      type: 'file-read',
      path: match[1]?.trim() || '',
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}

/**
 * Extract branch operations
 */
function extractBranchOperations(text: string): Action[] {
  const actions: Action[] = [];
  let match;

  while ((match = PATTERNS.branchCreate.exec(text)) !== null) {
    actions.push({
      type: 'branch-create',
      command: match[1]?.trim() || '',
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}

/**
 * Main parser function
 */
export function parseAgentResponse(text: string): ParsedResponse {
  const reasoning = extractReasoning(text);
  const actions: Action[] = [
    ...extractBashCommands(text),
    ...extractFileOperations(text),
    ...extractBranchOperations(text),
  ];

  return {
    reasoning,
    actions,
    raw: text,
  };
}

/**
 * Get action icon based on type
 */
export function getActionIcon(type: Action['type']): string {
  switch (type) {
    case 'bash': return '⚡';
    case 'file-create': return '📄';
    case 'file-modify': return '✏️';
    case 'file-read': return '📖';
    case 'branch-create': return '🌿';
    case 'commit': return '📝';
    case 'tool': return '🔧';
    default: return '•';
  }
}

/**
 * Get action label based on type
 */
export function getActionLabel(action: Action): string {
  switch (action.type) {
    case 'bash':
      return `Exec: ${action.command?.substring(0, 50) || ''}${action.command && action.command.length > 50 ? '...' : ''}`;
    case 'file-create':
      return `Created: ${action.path || ''}`;
    case 'file-modify':
      return `Modified: ${action.path || ''}`;
    case 'file-read':
      return `Read: ${action.path || ''}`;
    case 'branch-create':
      return `Branch: ${action.command || ''}`;
    case 'commit':
      return `Commit: ${action.command || ''}`;
    case 'tool':
      return `Tool: ${action.command || ''}`;
    default:
      return 'Action';
  }
}
