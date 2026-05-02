<script lang='ts'>
  export let isOpen = false
  export let onClick: () => void = () => {}
</script>

<button class='toggle' class:active={isOpen} on:click={onClick} title='Orchestrator'>
  {isOpen ? '✕' : '🤖'}
</button>

<style>
.toggle{position:fixed;right:12px;top:50%;transform:translateY(-50%);z-index:10000;width:40px;height:40px;border-radius:50%;background:#1a1a1a;border:1px solid #333;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,.4);transition:all .15s}
.toggle:hover{background:#2a2a2a;border-color:#555}
.toggle.active{background:#333}
</style>
