<script lang="ts">
import { listen } from '@tauri-apps/api/event'
import { onMount, onDestroy } from 'svelte'

// Event pattern for stable agent events
let eventPattern = 'project://trinity/stable-agent-event'

const AGENT_COLORS: Record<string, string> = {
  A: '#6366f1', B: '#8b5cf6', C: '#a855f7', D: '#ec4899',
  E: '#f43f5e', F: '#ef4444', G: '#f97316', H: '#f59e0b',
  I: '#eab308', J: '#84cc16', K: '#22c55e', L: '#10b981',
  M: '#14b8a6', N: '#06b6d4', O: '#0ea5e9', P: '#3b82f6',
  Q: '#6366f1', R: '#8b5cf6', S: '#a855f7', T: '#f59e0b',
  U: '#10b981', V: '#22c55e', W: '#06b6d4', X: '#ef4444',
  Y: '#84cc16', Z: '#6366f1', Q27: '#ffffff'
}

const AGENTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Q27']

type AgentMsg = {
  agent: string
  kind: string
  body: string
  ring: number | null
  ts: number
}

let messages: AgentMsg[] = []
let unlisten: (() => void) | null = null
let copiedId: string | null = null
let filterAgent: string | null = null

onMount(async () => {
  // Test message for development
  if (import.meta.env.DEV && messages.length === 0) {
    const testMsg: AgentMsg = {
      agent: 'Q',
      kind: 'chat',
      body: 'Ring-080: Test message. Click Copy button.',
      ring: 80,
      ts: Math.floor(Date.now() / 1000)
    }
    messages = [testMsg]
  }

  try {
    unlisten = await listen(eventPattern, (event: any) => {
      const data = event.payload || event
      const msg: AgentMsg = {
        agent: data.agent ?? '???',
        kind: data.kind ?? 'info',
        body: data.body ?? JSON.stringify(data),
        ring: data.ring ?? null,
        ts: data.ts ?? Date.now()
      }
      messages = [...messages.slice(-200), msg]
    })
  } catch (err) {
    // Silent fail
  }
})

onDestroy(() => {
  if (unlisten) unlisten()
})

function copyMsg(msg: AgentMsg) {
  if (!msg.body) return
  navigator.clipboard.writeText(msg.body).then(() => {
    copiedId = `${msg.agent}-${msg.ts}`
    setTimeout(() => copiedId = null, 2000)
  })
}

function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent] ?? '#888'
}

function clearMessages() {
  messages = []
}

function setFilter(agent: string | null) {
  filterAgent = agent
}

$: filteredMessages = filterAgent
  ? messages.filter(m => m.agent === filterAgent)
  : messages

$: agentCounts = AGENTS.reduce((acc, a) => {
  acc[a] = messages.filter(m => m.agent === a).length
  return acc
}, {} as Record<string, number>)
</script>

<div class="stable-chat-container">
  <!-- Sidebar with agents -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">Agents (27)</span>
      <span class="filter-status">
        {filterAgent ? `Filter: ${filterAgent}` : 'All'}
      </span>
    </div>
    <div class="agents-list">
      {#each AGENTS as agent}
        <button
          class="agent-item"
          class:active={filterAgent === agent}
          onclick={() => setFilter(filterAgent === agent ? null : agent)}
          style="border-left: 3px solid {AGENT_COLORS[agent]}"
        >
          <span class="agent-name">{agent}</span>
          <span class="agent-count">{agentCounts[agent] ?? 0}</span>
        </button>
      {/each}
    </div>
    <button class="clear-btn" onclick={clearMessages}>
      Clear All
    </button>
  </aside>

  <!-- Chat messages -->
  <div class="stable-chat">
  {#each filteredMessages as msg (msg.ts)}
    <div class="msg" style="border-left: 3px solid {getAgentColor(msg.agent)}">
      <span class="badge" style="color: {getAgentColor(msg.agent)}">[{msg.agent}]</span>
      {#if msg.ring}<span class="ring">ring-{msg.ring}</span>{/if}
      <span class="kind {msg.kind}">{msg.kind}</span>
      <span class="body">{msg.body}</span>
      <button
        class="copy"
        class:copied={copiedId === `${msg.agent}-${msg.ts}`}
        onclick={() => copyMsg(msg)}
        title="Copy message"
      >
        {copiedId === `${msg.agent}-${msg.ts}` ? '✓' : '📋'}
      </button>
    </div>
  {/each}

  {#if filteredMessages.length === 0}
    <div class="empty">
      <p>{filterAgent ? `No messages from ${filterAgent}` : 'Waiting for agent events...'}</p>
    </div>
  {/if}
  </div>
</div>


<style>
  .msg {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #1a1a1a;
    border-radius: 4px;
    flex-wrap: wrap;
  }

  .badge {
    font-weight: 600;
    font-size: 11px;
    background: #2a2a2a;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
  }

  .ring {
    font-size: 10px;
    color: #888;
    background: #2a2a2a;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
  }

  .kind {
    font-size: 10px;
    color: #888;
    background: #2a2a2a;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
    min-width: 40px;
    text-align: center;
  }

  .kind.verdict { color: #22c55e; }
  .kind.test { color: #3b82f6; }
  .kind.error { color: #ef4444; }
  .kind.chat { color: #3b82f6; }

  .body {
    color: #e8e8e8;
    flex: 1;
    word-break: break-word;
    line-height: 1.4;
  }

  .copy {
    background: #2a2a2a;
    border: 1px solid #444;
    color: #999;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    margin-left: auto;
    border-radius: 4px;
    transition: all 0.15s;
    opacity: 0.8;
  }

  .copy:hover {
    color: #fff;
    background: #3a3a3a;
    border-color: #666;
    opacity: 1;
  }

  .copy.copied {
    color: #22c55e;
    border-color: #22c55e;
    background: #22c55e22;
  }

  .empty {
    padding: 24px;
    color: #888;
    text-align: center;
    font-style: italic;
  }

  .stable-chat-container {
    display: flex;
    height: 100%;
  }

  .sidebar {
    width: 140px;
    background: #151515;
    border-right: 1px solid #2a2a2a;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 12px;
    border-bottom: 1px solid #2a2a2a;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sidebar-title {
    font-weight: 600;
    font-size: 12px;
    color: #e8e8e8;
  }

  .filter-status {
    font-size: 10px;
    color: #888;
  }

  .agents-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }

  .agents-list::-webkit-scrollbar { width: 4px; }
  .agents-list::-webkit-scrollbar-track { background: #111; }
  .agents-list::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

  .agent-item {
    background: #1e1e1e;
    border: none;
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: all 0.15s;
  }

  .agent-item:hover {
    background: #2a2a2a;
  }

  .agent-item.active {
    background: #2a2a2a;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.1);
  }

  .agent-name {
    font-weight: 600;
    font-size: 13px;
    color: #e8e8e8;
  }

  .agent-count {
    font-size: 10px;
    color: #666;
  }

  .clear-btn {
    margin: 8px;
    padding: 8px 12px;
    background: #ef4444;
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .clear-btn:hover {
    opacity: 0.85;
  }

  .stable-chat {
    flex: 1 1 auto;
    min-width: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    padding: 12px;
  }
</style>
