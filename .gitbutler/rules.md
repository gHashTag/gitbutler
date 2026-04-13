# GitButler AI Rules for t27 Trinity S³AI Project

This file contains project-specific conventions for Claude when working with the t27 codebase.

---

## Core Identity Law (L5)

**PHI IDENTITY**: φ² = φ + 1; φ² + φ⁻² = 3

When working with numerical code, ensure phi identity is preserved:
- φ ≈ 1.6180339887498948482 (IEEE f64)
- φ² = 2.6180339887498948482
- φ⁻² ≈ 0.3819660112501051518
- φ² + φ⁻² = 3.0 (exactly, within IEEE tolerance)

Always validate phi calculations with tolerance, never assume exact equality due to floating-point precision.

---

## Language and Character Encoding (L3 - PURITY)

**ASCII-Only Policy**: All source files must contain only ASCII characters (0-127).

- No Unicode identifiers in source code
- English-only comments and documentation
- Markdown files (`.md`) use ASCII only
- Generated output follows same rules

Exception: Legacy paths under `docs/.legacy-non-english-docs/` may contain non-ASCII content but are not actively maintained.

---

## Ring and PHI LOOP Conventions

**Ring Naming**: `ring-NNN-PHASE` format

- NNN: 3-digit zero-padded ring number (e.g., `ring-072`)
- PHASE: Phase suffix from `PHI LOOP`
  - `issue` (Phase 1)
  - `spec` (Phase 2)
  - `tdd` (Phase 3)
  - `impl` (Phase 4) - also `code` in conversation
  - `gen` (Phase 5)
  - `seal` (Phase 6)
  - `verify` (Phase 7)
  - `land` (Phase 8)
  - `learn` (Phase 9)

**PHI LOOP Phases** (1→9):
1. **Issue**: Define problem or requirement
2. **Spec**: Write .t27 specification
3. **TDD**: Write tests in spec before implementation
4. **Code**: Implement according to spec
5. **Gen**: Run `tri gen` to generate code from spec
6. **Seal**: Verify generated code and seal hash
7. **Verify**: Run `tri test` or conformance checks
8. **Land**: Merge changes to main branch
9. **Learn**: Capture learnings and update knowledge base

**Next Phase**: When AI completes a phase, indicate readiness to proceed:
- "Phase complete", "proceed to next phase", or similar language
- Creates `ring-NNN-{nextPhase}` branch automatically

---

## Testability Mandate (L4)

Every `.t27` spec MUST contain at least one of:
- `test` section: Test cases and expected behavior
- `invariant` section: Mathematical invariants or properties
- `bench` section: Performance benchmarks

When generating or modifying specs, ensure test coverage is maintained.

---

## Generation Law (L2)

**Generated Files Under `gen/`**: Never hand-edit generated files.

- All generated code originates from `.t27` specifications
- To change behavior: modify the spec, then regenerate
- Exceptions must be documented in project constitution

---

## File and Naming Conventions

**ASCII Identifiers Only**: All function names, variables, types use ASCII.

- No accented characters or Unicode in code
- English names: `calculatePhi`, not `phiBerechnen`
- Consistent naming: `ring-072-spec`, not `ring_72_spec`

**Directory Structure**:
- `specs/`: All .t27 specification files
- `compiler/`: Core compiler implementation
- `bootstrap/`: Build system and stage0
- `gen/`: Generated code (never hand-edit)
- `conformance/`: Conformance tests
- `tests/`: Verification tests

---

## Commit and Issue Gate (L1)

**TRACEABILITY**: No code merged without `Closes #N` reference.

- All PRs must reference an issue
- Use `Closes #123` or `Fixes #45` format
- Issue numbers are tracked in project issue tracker

---

## Security and Sacred Constants (L6 - CEILING)

**FORMAT-SPEC-001.json + gf16.t27**: These files are the numeric SSOT.

- Do not modify FORMAT-SPEC-001.json manually
- gf16.t27 defines GF16 format specification
- Changes to numeric format must go through specification update

---

## Shell Script Policy (L7 - UNITY)

**No New Shell Scripts on Critical Path**.

- Use `tri` command or `t27c` runner instead
- Existing `*.sh` files may remain but no new ones on verification path
- Prefer TypeScript/Rust implementations for new tooling

---

## Cursor-Like @ Mentions

**File Context**: When user types `@filename` or `@ring-072`, automatically include that context.

- `@app.tsx`: Read and prepend app.tsx content to chat
- `@ring-072`: Include summary of ring-072 work
- File paths are relative to project root

**Example Usage**:
```
User: @SOUL.md what are the 7 invariant laws?
System: [Content of SOUL.md will be included automatically]
```

---

## Branch Context Awareness

**Unstaged Changes**: When opening chat, show context of modified files.

- Display files that are currently unstaged in Git
- This helps AI understand what user is actively working on
- Displayed in chat panel below header

---

## Integration Notes

- This project uses GitButler virtual branches for ring-based workflow
- PHI LOOP progress is tracked via branch name suffix
- Each ring advances through 9 phases before merging
- Use `tri` command for spec-first development operations
