<script lang='ts'>
  import QueenTrinityChat from './QueenTrinityChat.svelte'
  import StableChat from './StableChat.svelte'

  interface Props {
    isOpen: boolean
    onClose: () => void
    projectId?: string
  }

  const { isOpen, onClose, projectId }: Props = $props()
  let activeTab = 'chat'
</script>

<div class='panel' class:open={isOpen}>
  <div class='header'>
    <span>Orchestrator</span>
    <button on:click={onClose}>✕</button>
  </div>
  <div class='tabs'>
    <button class:active={activeTab==='chat'} on:click={()=>activeTab='chat'}>Chat</button>
    <button class:active={activeTab==='stable'} on:click={()=>activeTab='stable'}>Stable</button>
    <button class:active={activeTab==='repos'} on:click={()=>activeTab='repos'}>Repos</button>
    <button class:active={activeTab==='rings'} on:click={()=>activeTab='rings'}>Rings</button>
    <button class:active={activeTab==='activity'} on:click={()=>activeTab='activity'}>Activity</button>
  </div>
  <div class='content'>
    {#if activeTab === 'chat'}<QueenTrinityChat />{/if}
    {#if activeTab === 'stable'}<StableChat />{/if}
    {#if activeTab === 'repos'}<p class='empty'>Repositories — coming soon</p>{/if}
    {#if activeTab === 'rings'}<p class='empty'>Ring Map (0–31) — coming soon</p>{/if}
    {#if activeTab === 'activity'}<p class='empty'>No recent activity</p>{/if}
  </div>
</div>

<style>
.panel{position:fixed;top:0;right:0;height:100vh;width:340px;z-index:9999;background:#1a1a1a;border-left:1px solid #2a2a2a;box-shadow:-8px 0 32px rgba(0,0,0,.6);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .25s cubic-bezier(.4,0,.2,1);overflow:hidden}
.panel.open{transform:translateX(0)}
.header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #2a2a2a;font-size:16px;font-weight:700;color:#fff;flex-shrink:0}
.header button{background:none;border:none;color:#888;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:4px}
.header button:hover{color:#fff;background:#2a2a2a}
.tabs{display:flex;border-bottom:1px solid #2a2a2a;flex-shrink:0;flex-wrap:wrap}
.tabs button{flex:1 0 0 20%;background:none;border:none;color:#666;padding:10px 0;font-size:12px;cursor:pointer;border-bottom:2px solid transparent}
.tabs button.active{color:#fff;border-bottom-color:#fff}
.content{flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0}
.empty{padding:24px;color:#555;font-size:13px;text-align:center}
</style>
