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
export const AGENT_REGISTRY: Record<string, string> = {
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
