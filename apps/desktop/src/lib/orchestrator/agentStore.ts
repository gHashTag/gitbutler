import { writable } from 'svelte/store';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { homeDir, join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

export type AgentState = 'thinking' | 'working' | 'waiting' | 'done' | 'error';

export interface AgentStatus {
	id: string; // agent letter: A-Z + 27th
	name: string; // "Queen Trinity", "LSP Validator", etc.
	branch: string; // "ring-072-impl"
	state: AgentState;
	lastAction: string; // "Analyzing ring-072 spec..."
	lastSeen: Date;
	ringNumber: number | null;
	phase: string | null; // "impl", "seal", etc.
}

// t27 agent registry — 27 agents
const AGENT_REGISTRY: Record<string, string> = {
	T: 'Queen Trinity',
	L: 'LSP Validator',
	C: 'Compiler',
	V: 'Verification',
	A: 'Architecture',
	B: 'Bootstrap',
	D: 'Documentation',
	E: 'Evaluation',
	F: 'FPGA',
	G: 'Gamma Search',
	H: 'HSLM Neural',
	I: 'Integration',
	J: 'JSON Bridge',
	K: 'Kernel',
	M: 'Memory',
	N: 'Network',
	O: 'Orchestrator',
	P: 'Parser',
	Q: 'Quality',
	R: 'Refactor',
	S: 'Security',
	U: 'UI',
	W: 'Workspace',
	X: 'Xref',
	Y: 'YAML Config',
	Z: 'ZK Proof',
	'27': 'Ω (Omega)',
};

export const agentsStore = writable<AgentStatus[]>([]);

export function agents() {
	return agentsStore;
}

export async function refreshAgentStatuses(repoPath: string) {
	const detectedAgents: AgentStatus[] = [];

	try {
		// Check for t27 repo sessions using shell command
		const home = await homeDir();
		const sessionsPath = await join(home, '.claude', 'projects');

		// Simple check for active sessions
		if (await exists(sessionsPath)) {
			try {
				// Try to list session files
				const result = await invoke('shell_command', {
					command: 'bash',
					args: ['-c', `find "${sessionsPath}" -name "*.jsonl" -mmin -30 2>/dev/null | head -5`],
				}) as string;

				if (result && result.trim()) {
					const files = result.trim().split('\n');
					for (const filePath of files) {
						try {
							const content = await readTextFile(filePath);
							const lines = content.trim().split('\n');
							if (lines.length > 0) {
								const lastLine = JSON.parse(lines[lines.length - 1]!);
								// Try to extract agent info from the session
								if (lastLine.agent || lastLine.role) {
									const agentId = (lastLine.agent || 'T') as string;
									const agentName = AGENT_REGISTRY[agentId] || 'Unknown Agent';

									// Extract ring/branch info
									let ringNumber: number | null = null;
									let phase: string | null = null;
									const context = lastLine.branch || lastLine.context || '';
									const ringMatch = context.match(/ring-(\d+)/i);
									if (ringMatch && ringMatch[1]) {
										ringNumber = parseInt(ringMatch[1]);
										const phaseMatch = context.match(/ring-\d+-(\w+)/i);
										if (phaseMatch && phaseMatch[1]) {
											phase = phaseMatch[1];
										}
									}

									detectedAgents.push({
										id: agentId,
										name: agentName,
										branch: (lastLine.branch as string | undefined) || 'unknown',
										state: 'working',
										lastAction: ((lastLine.content as string | undefined) || 'Active session').slice(0, 50),
										lastSeen: new Date(),
										ringNumber,
										phase,
									});
								}
							}
						} catch {
							// Skip invalid session files
						}
					}
				}
			} catch {
				// Fall back to empty state if invoke fails
			}
		}
	} catch (e) {
		console.error('Failed to detect agents:', e);
	}

	agentsStore.set(detectedAgents);
}

// Polling
let pollInterval: ReturnType<typeof setInterval>;

export function startAgentPolling(repoPath: string) {
	refreshAgentStatuses(repoPath);
	pollInterval = setInterval(() => refreshAgentStatuses(repoPath), 5000);
}

export function stopAgentPolling() {
	if (pollInterval) {
		clearInterval(pollInterval);
	}
}
