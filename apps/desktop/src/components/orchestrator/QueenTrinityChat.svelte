<script lang='ts'>
  import { writable } from 'svelte/store'
  import { onMount } from 'svelte'
  import { runQueenSelfTest } from '$lib/orchestrator/queenSelfTest'

  interface Msg { id: string; role: 'user'|'queen'; content: string; time: string }

  const messages = writable<Msg[]>([])
  let loading = false
  let input = ''
  let copied = ''

  onMount(() => {
    if (import.meta.env.DEV) {
      runQueenSelfTest()
    }
  })

  async function getKey(): Promise<string | null> {
    // 1. localStorage
    if (typeof localStorage !== "undefined") {
      const k = localStorage.getItem("zai-key")
      if (k && k.length > 10) return k
    }

    // 2. Tauri invoke — читаем через backend
    try {
      const { invoke } = await import("@tauri-apps/api/core")
      const content: string = await invoke("read_file_content", {
        path: "/Users/playra/.claude/.env"
      })
      const m = content.match(/ZAI_KEY_1=([^\n\r]+)/)
      if (m?.[1]) {
        const key = m[1].trim()
        localStorage.setItem("zai-key", key)
        return key
      }
    } catch (_) {}

    // 3. Попробуй env через import.meta.env (Vite)
    const envKey = (import.meta as any).env?.VITE_ZAI_KEY
    if (envKey) {
      localStorage.setItem("zai-key", envKey)
      return envKey
    }

    return null
  }

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()
    input = ''
    const time = new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})
    messages.update(m => [...m, { id: crypto.randomUUID(), role:'user', content:text, time }])
    loading = true

    const key = await getKey()
    let reply = ''
    if (!key) {
      reply = '⚠️ Нет ключа z.ai. Добавь ZAI_KEY_1=... в ~/.claude/.env'
    } else {
      try {
        const hist: Msg[] = []
        messages.subscribe(m => { hist.splice(0); hist.push(...m) })()
        const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions',{
          method:'POST',
          headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
          body: JSON.stringify({
            model:'glm-4-flash',
            max_tokens:512,
            messages:[
              {role:'system',content:'Ты Queen Trinity — AI оркестратор Trinity S3AI (t27). 27 агентов, 32 rings, PHI LOOP, GitButler. Кратко и технично. φ²+φ⁻²=3|TRINITY'},
              ...hist.slice(-10).map(m=>({role:m.role==='queen'?'assistant':'user',content:m.content})),
              {role:'user',content:text}
            ]
          })
        })
        if (!res.ok) { const e=await res.text(); reply='❌ z.ai '+res.status+': '+e.slice(0,100) }
        else { const d=await res.json(); reply=d?.choices?.[0]?.message?.content??'⚠️ empty' }
      } catch(e) { reply='❌ '+String(e).slice(0,100) }
    }

    messages.update(m=>[...m,{id:crypto.randomUUID(),role:'queen',content:reply,time:new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}])
    loading=false
  }

  function onKey(e:KeyboardEvent){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}
  async function copy(id:string,text:string){await navigator.clipboard.writeText(text);copied=id;setTimeout(()=>copied='',2000)}
</script>

<div class='chat'>
  <div class='msgs'>
    {#each $messages as m (m.id)}
      <div class='row {m.role}'>
        <div class='bubble'>
          <p>{m.content}</p>
          <button class='copy' class:copied={copied===m.id} onclick={()=>copy(m.id,m.content)}>{copied===m.id?'Copied':'Copy'}</button>
        </div>
        <span class='meta'>{m.time}</span>
      </div>
    {/each}
    {#if loading}
      <div class="row queen">
        <div class="bubble">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    {/if}
  </div>
  <div class='input-row'>
    <input bind:value={input} onkeydown={onKey} placeholder='Ask Queen Trinity...' />
    <button class="send-btn" disabled={!input.trim() || loading}>Send</button>
  </div>
</div>

<style>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #111;
}

.msgs {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.msgs::-webkit-scrollbar { width: 4px; }
.msgs::-webkit-scrollbar-track { background: transparent; }
.msgs::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

.row { display: flex; flex-direction: column; max-width: 85%; }
.row.user { align-self: flex-end; align-items: flex-end; }
.row.queen { align-self: flex-start; align-items: flex-start; }

.bubble {
  border-radius: 16px;
  padding: 10px 14px;
  position: relative;
  min-height: 24px;
}
.row.user .bubble {
  background: #e8e8e8;
  color: #111;
  border-bottom-right-radius: 4px;
}
.row.queen .bubble {
  background: #1e1e1e;
  color: #e8e8e8;
  border: 1px solid #2a2a2a;
  border-bottom-left-radius: 4px;
}

.bubble p {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.copy {
  font-size: 12px;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  opacity: 1;
  pointer-events: auto;
}
.copy:hover { color: #111; background: rgba(0,0,0,0.1); }
.row.queen .copy { color: #999; border: 1px solid #444; opacity: 0.9; }
.row.queen .copy:hover { color: #fff; background: #3a3a3a; border-color: #666; opacity: 1; }
.copy.copied { color: #22c55e; border-color: #22c55e; background: #22c55e22; opacity: 1; }

.meta { font-size: 10px; color: #444; margin-top: 3px; padding: 0 2px; }

.typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
.typing span {
  width: 6px; height: 6px; background: #555; border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #1e1e1e;
  background: #111;
  flex-shrink: 0;
}

.input-row input {
  flex: 1;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
  padding: 9px 16px;
  color: #e8e8e8;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.input-row input:focus { border-color: #444; }
.input-row input::placeholder { color: #444; }

.send-btn {
  background: #fff;
  color: #111;
  border: none;
  border-radius: 20px;
  padding: 9px 18px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.send-btn:hover { opacity: 0.85; }
.send-btn:disabled { opacity: 0.4; cursor: default; }
</style>
