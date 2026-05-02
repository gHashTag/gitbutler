import { PROJECTS_SERVICE } from '$lib/project/projectsService';
import { writable } from 'svelte/store';
import { inject } from '@gitbutler/core/context';

export type RepoStatusType = 'passing' | 'failing' | 'running' | 'unknown';

export interface RepoData {
	id: string;
	name: string;
	path: string;
}

export interface RepoStatus extends RepoData {
	activeAgents: number;
	unstagedCount: number;
	activeBranches: string[];
	ciStatus: RepoStatusType;
	lastCommit: string;
	currentRing: number | null;
}

export const reposStore = writable<RepoStatus[]>([]);

export async function refreshRepos() {
	const projectsService = inject(PROJECTS_SERVICE);
	const projectsResult = projectsService.projects();

	if (!projectsResult || !projectsResult.response) {
		return;
	}

	const projects = projectsResult.response;

	// Map projects to RepoStatus format
	reposStore.set(projects.map((p) => ({
		id: p.id,
		name: p.title,
		path: p.path,
		activeAgents: 0,
		unstagedCount: 0,
		activeBranches: [],
		ciStatus: 'unknown',
		lastCommit: '',
		currentRing: null,
	})));
}
