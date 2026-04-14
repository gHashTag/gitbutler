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

onMount(async () => {
  // Test message for development
  if (import.meta.env.DEV && messages.length === 0) {
    const testMsg: AgentMsg = {
      agent: 'Q',
      kind: 'chat',
      body: 'Ring-080: Test message. Click 📋 to copy.',
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
</script>

<div class="stable-chat">
  {#each messages as msg (msg.ts)}
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

  {#if messages.length === 0}
    <div class="empty">
      <p>Waiting for agent events...</p>
    </div>
  {/if}
</div>

<style>
  .stable-chat {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    padding: 12px;
  }

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
</style>
