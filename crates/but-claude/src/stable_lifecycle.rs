//! Stable lifecycle management for Trinity Ring-080.
//!
//! Provides stable lifecycle functionality for Trinity agents.
//!
//! Architecture:
//!   Backend (but-claude):
//!   - stable_watcher.rs: watches .trinity/experience/*.jsonl → broadcasts AgentEvent
//!
//! Frontend (Svelte/Tauri):
//!   - StableChat.svelte: listens for 'project://<project_id>/stable-agent-event'
//!   - OrchestratorPanel.svelte: has tab/buttons to open StableChat

use std::path::PathBuf;

/// Start a stable watcher for the given experience directory and project ID.
///
/// This function:
/// 1. Creates a broadcast channel for agent events
/// 2. Spawns a StableWatcher to monitor .trinity/experience/*.jsonl
/// 3. Returns a JoinHandle that can be used to stop the watcher
///
/// # Arguments
/// * `experience_dir` - Path to .trinity/experience directory
/// * `project_id` - Project ID for event naming
///
/// # Returns
/// A JoinHandle that can be awaited to stop the watcher
///
/// # Example
/// ```rust,no_run
/// use std::path::PathBuf;
///
/// let experience_dir = PathBuf::from("/path/to/project/.trinity/experience");
/// let project_id = "my-project-id".to_string();
/// let handle = but_claude::stable_lifecycle::start_stable_watcher(experience_dir, project_id);
/// ```
///
/// # Frontend Integration
///
/// In your Svelte component, listen for events:
/// ```typescript
/// import { listen } from '@tauri-apps/api/event'
///
/// const projectId = getProjectId() // Get your project ID
///
/// onMount(async () => {
///   const unlisten = await listen<AgentEvent>(
///     `project://${projectId}/stable-agent-event`,
///     (e) => {
///       console.log('Agent event:', e.payload)
///     }
///   )
///
///   onDestroy(() => {
///     unlisten()
///   })
/// })
/// ```
pub use crate::stable_watcher::start_stable_watcher;
