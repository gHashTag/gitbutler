use std::path::Path;

use serde::{Deserialize, Serialize};
use tokio::fs::{self, DirEntry};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SubAgent {
    name: String,
    description: String,
    tools: Option<Vec<String>>,
    model: Option<String>,
    /// Agent ID (e.g., "V", "C", "Q27") for Trinity Ring-080
    /// Deterministic mapping: if not set, derive from filename
    /// e.g., "agent-v-verdict.md" -> "V"
    #[serde(rename = "agentId")]
    agent_id: Option<String>,
}

pub async fn read_claude_sub_agents(project_path: &Path) -> Vec<SubAgent> {
    let mut out = vec![];

    if let Some(home_dir) = dirs::home_dir().map(|p| p.join(".claude/agents"))
        && let Some(agents) = read_agents(&home_dir).await
    {
        for agent in agents {
            out.push(agent);
        }
    }

    if let Some(agents) = read_agents(&project_path.join(".claude/agents")).await {
        for agent in agents {
            out.push(agent);
        }
    }

    out
}

async fn read_agents(path: &Path) -> Option<Vec<SubAgent>> {
    if !fs::try_exists(path).await.unwrap_or(false) {
        return None;
    }

    let mut out = vec![];

    let mut entries = fs::read_dir(path).await.ok()?;
    loop {
        match entries.next_entry().await {
            Ok(Some(entry)) => {
                if let Some(agent) = read_entry(entry).await {
                    out.push(agent)
                }
            }
            Ok(None) => break,
            Err(_) => continue,
        }
    }

    Some(out)
}

async fn read_entry(entry: DirEntry) -> Option<SubAgent> {
    let entry_type = entry.file_type().await.ok()?;
    if !entry_type.is_file() {
        return None;
    };
    let string = fs::read_to_string(entry.path()).await.ok()?;
    let mut in_frontmatter = false;
    let mut agent = SubAgent {
        name: "".into(),
        description: "".into(),
        tools: None,
        model: None,
        agent_id: None,
    };
    for line in string.lines() {
        if !in_frontmatter && line == "---" {
            in_frontmatter = true;
            continue;
        }
        if in_frontmatter && line == "---" {
            break;
        }
        // Parse the NOT YAML
        if in_frontmatter && let Some((key, value)) = line.split_once(": ") {
            match key {
                "name" => agent.name = value.into(),
                "description" => agent.description = value.into(),
                "tools" => {
                    agent.tools = Some(value.split(", ").map(Into::into).collect::<Vec<_>>())
                }
                "model" => agent.model = Some(value.into()),
                "agentId" => {
                    // Parse agent_id from frontmatter (e.g., "V", "C", "Q27")
                    agent.agent_id = Some(value.trim().into());
                }
                _ => {}
            }
        }
    }

    // Deterministic mapping: derive agent_id from filename if not set
    if agent.agent_id.is_none() {
        let os_filename = entry.file_name().to_os_string();
        let filename = os_filename.to_string_lossy();
        // Extract agent ID from filename like "agent-v-verdict.md" -> "V"
        if let Some(caps) = filename.strip_prefix("agent-").and_then(|s: &str| s.strip_suffix("-verdict.md")) {
            if caps.len() == 1 {
                let c = caps.chars().next().unwrap_or('?');
                agent.agent_id = Some(c.to_string());
            }
        } else if let Some(caps) = filename.strip_prefix("agent-").and_then(|s: &str| s.strip_suffix(".md")) {
            // For files like "agent-a.md" -> "A" (without -verdict suffix)
            if caps.len() == 1 {
                let c = caps.chars().next().unwrap_or('?');
                agent.agent_id = Some(c.to_string());
            }
        }
    }

    Some(agent)
}
