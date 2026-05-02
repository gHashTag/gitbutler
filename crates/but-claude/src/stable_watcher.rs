//! StableWatcher - File-based agent event broadcaster for Trinity Ring-080.
//!
//! Watches .trinity/experience/*.jsonl files for agent events and broadcasts
//! them to the frontend via existing broadcaster infrastructure.
//!
//! Architecture:
//!   Agent → .trinity/experience/*.jsonl (write JSONL line)
//!              ↓
//!   FileWatcher (this module) → parse → broadcaster.send()
//!                                      ↓
//!                                  Frontend receives events
//!
//! This design follows L7 UNITY - agents write to files, don't know about UI.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::PathBuf,
    sync::Arc,
};
use tokio::{
    task::JoinHandle,
};
use tokio_util::sync::CancellationToken as Ct;

/// Agent event written to experience JSONL files.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEvent {
    /// Agent identifier (e.g., "V", "C", "Q27")
    pub agent: String,
    /// Event kind ("verdict", "test", "error", "chat")
    pub kind: String,
    /// Event body content
    pub body: String,
    /// Ring number (if applicable)
    pub ring: Option<u8>,
    /// Unix timestamp
    pub ts: u64,
}

impl AgentEvent {
    /// Convert to FrontendEvent for broadcasting.
    /// Uses project-scoped pattern: project://{project_id}/stable-agent-event
    pub fn to_frontend_event(self, project_id: &str) -> crate::FrontendEvent {
        crate::FrontendEvent {
            name: format!("project://{project_id}/stable-agent-event"),
            payload: serde_json::json!(self),
        }
    }
}

/// Watches .trinity/experience/*.jsonl and broadcasts AgentEvents.
pub struct StableWatcher {
    /// Broadcaster for sending events to frontend
    broadcaster: Arc<tokio::sync::Mutex<crate::Broadcaster>>,
    /// Directory containing .jsonl experience files
    experience_dir: PathBuf,
    /// Project ID for event routing
    project_id: String,
    /// Cancellation token for stopping the watcher
    cancel_token: Ct,
}

impl StableWatcher {
    /// Create a new StableWatcher.
    pub fn new(broadcaster: Arc<tokio::sync::Mutex<crate::Broadcaster>>, experience_dir: PathBuf, project_id: String) -> Self {
        Self {
            broadcaster,
            experience_dir,
            project_id,
            cancel_token: Ct::new(),
        }
    }

    /// Start watching experience files for new events.
    ///
    /// This is the main watch loop that polls for file changes.
    pub async fn watch(&self) -> Result<()> {
        // Ensure experience directory exists
        if let Err(e) = tokio::fs::create_dir_all(&self.experience_dir).await {
            tracing::error!("Failed to create experience directory: {}", e);
            return Err(e.into());
        }

        tracing::info!(
            "StableWatcher watching: {} (project: {})",
            self.experience_dir.display(),
            self.project_id
        );

        // Track file positions to detect new lines
        let mut file_positions: std::collections::HashMap<PathBuf, u64> =
            std::collections::HashMap::new();

        loop {
            // Check for cancellation before scanning
            if self.cancel_token.is_cancelled() {
                tracing::info!("StableWatcher cancelled, shutting down");
                return Ok(());
            }

            // Re-scan directory periodically (every 500ms)
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            // Read all .jsonl files
            let entries = match std::fs::read_dir(&self.experience_dir) {
                Ok(e) => e,
                Err(e) => {
                    tracing::error!("Failed to read experience directory: {}", e);
                    continue;
                }
            };

            let entries: Vec<_> = entries
                .filter_map(Result::ok)
                .filter(|e| {
                    e.path().extension().and_then(|ext| ext.to_str()) == Some("jsonl")
                })
                .collect();

            for entry in &entries {
                let path = entry.path();
                let current_pos = *file_positions.get(&path).unwrap_or(&0);

                // Open file and read new lines
                match File::open(&path) {
                    Ok(file) => {
                        let reader = BufReader::new(file);
                        let mut new_lines = 0u64;

                        for line in reader.lines().skip(current_pos as usize) {
                            if let Ok(line) = line {
                                let trimmed = line.trim();
                                if !trimmed.is_empty() {
                                    // Parse JSONL line as AgentEvent
                                    match serde_json::from_str::<AgentEvent>(trimmed) {
                                        Ok(event) => {
                                            tracing::debug!(
                                                "Agent event from {}: agent={}, kind={}",
                                                path.display(),
                                                event.agent,
                                                event.kind
                                            );

                                            // Broadcast to frontend
                                            let frontend_event = event.to_frontend_event(&self.project_id);
                                            let broadcaster = self.broadcaster.lock().await;
                                            broadcaster.send(frontend_event);

                                            new_lines += 1;
                                        }
                                        Err(e) => {
                                            tracing::warn!(
                                                "Failed to parse JSONL line from {}: {}",
                                                path.display(),
                                                e
                                            );
                                        }
                                    }
                                }
                            }
                        }

                        // Update file position
                        if new_lines > 0 {
                            file_positions.insert(path, current_pos + new_lines);
                        }
                    }
                    Err(e) => {
                        tracing::error!("Failed to open {}: {}", path.display(), e);
                    }
                }
            }
        }
    }

    /// Shutdown the watcher by cancelling the cancellation token.
    pub fn shutdown(&self) {
        self.cancel_token.cancel();
        tracing::info!("StableWatcher shutdown requested");
    }

    /// Spawn the watcher as a background task.
    ///
    /// Returns a JoinHandle that can be awaited to wait for completion.
    pub fn spawn(self: Arc<Self>) -> JoinHandle<()> {
        tokio::spawn(async move {
            let _ = Self::watch(&self).await;
        })
    }

    /// Public wrapper for calling watch (used by Arc clone pattern).
    pub fn start(self: Arc<Self>) -> JoinHandle<()> {
        tokio::spawn(async move {
            let _ = Self::watch(&self).await;
        })
    }
}
