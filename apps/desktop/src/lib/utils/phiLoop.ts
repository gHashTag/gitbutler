/**
 * PHI LOOP phase utilities for t27 ring-based development
 */

export const PHASES = [
	{ name: "Issue", value: "issue" },
	{ name: "Spec", value: "spec" },
	{ name: "TDD", value: "tdd" },
	{ name: "Code", value: "impl" },
	{ name: "Gen", value: "gen" },
	{ name: "Seal", value: "seal" },
	{ name: "Verify", value: "verify" },
	{ name: "Land", value: "land" },
	{ name: "Learn", value: "learn" },
] as const;

export const PHASE_MAP: Record<string, number> = {
	issue: 1,
	spec: 2,
	tdd: 3,
	impl: 4,
	gen: 5,
	seal: 6,
	verify: 7,
	land: 8,
	learn: 9,
};

export const PHASE_ORDER = ["issue", "spec", "tdd", "impl", "gen", "seal", "verify", "land", "learn"] as const;

export type PhaseSuffix = typeof PHASE_ORDER[number];

/**
 * Parse ring number from branch name
 * @param branchName - e.g. "ring-072-spec", "ring-7-impl", "feat/something"
 * @returns ring number without leading zeros (e.g. "72", "7") or null
 */
export function parseRingNumber(branchName: string): string | null {
	const match = branchName.match(/ring-0*(\d+)/i);
	return match && match[1] ? match[1] : null;
}

/**
 * Parse phase from branch name suffix
 * @param branchName - e.g. "ring-072-spec", "ring-7-impl"
 * @returns phase suffix (e.g. "spec", "impl") or null
 */
export function parsePhaseSuffix(branchName: string): PhaseSuffix | null {
	const match = branchName.match(/ring-\d+-(\w+)/i);
	if (!match || !match[1]) return null;
	const suffix = match[1].toLowerCase();
	return PHASE_ORDER.includes(suffix as PhaseSuffix) ? (suffix as PhaseSuffix) : null;
}

/**
 * Get phase number from suffix
 * @param suffix - phase suffix (e.g. "spec", "impl")
 * @returns phase number (1-9) or null
 */
export function getPhaseNumber(suffix: string): number | null {
	return PHASE_MAP[suffix.toLowerCase()] || null;
}

/**
 * Check if branch name matches ring pattern
 * @param branchName - branch name to check
 */
export function isRingBranch(branchName: string): boolean {
	return /ring-\d+/i.test(branchName);
}

/**
 * Get next phase in sequence
 * @param currentPhase - current phase suffix
 * @returns next phase suffix or null if at end
 */
export function getNextPhase(currentPhase: PhaseSuffix): PhaseSuffix | null {
	const currentIndex = PHASE_ORDER.indexOf(currentPhase);
	if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) return null;
	return PHASE_ORDER[currentIndex + 1] ?? null;
}

/**
 * Format ring number with leading zeros
 * @param ringNum - ring number (e.g. "72", "7")
 * @param padding - number of digits (default 3)
 * @returns padded ring number (e.g. "072", "007")
 */
export function formatRingNumber(ringNum: string, padding: number = 3): string {
	return ringNum.padStart(padding, '0');
}
