export interface ChatMessage {
	id: string;
	role: 'user' | 'queen' | 'system';
	content: string;
	timestamp: string;
}

export interface AgentStatus {
	id: string;
	name: string;
	status: 'active' | 'idle' | 'error' | 'busy';
	currentTask?: string;
	lastActivity?: string;
}

export interface RepoInfo {
	name: string;
	path: string;
	branch: string;
	status: 'clean' | 'dirty' | 'ahead' | 'behind';
	lastCommit?: string;
}

export interface RingStatus {
	id: number;
	status: 'complete' | 'in-progress' | 'blocked' | 'pending';
	label?: string;
	progress?: number;
}

export interface ActivityItem {
	id: string;
	type: 'agent' | 'ring' | 'system';
	message: string;
	timestamp: string;
	status?: 'info' | 'warning' | 'error';
}
