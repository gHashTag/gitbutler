export async function runQueenSelfTest(): Promise<void> {
  console.log("🧪 Queen Trinity Self-Test Starting...")

  // Test 1: API key
  const key = typeof localStorage !== "undefined" ? localStorage.getItem("zai-key") : null
  console.log("Test 1 — API key:", key ? "✅ found (" + key.slice(0,8) + "...)" : "❌ missing")

  if (!key) {
    console.error("❌ Self-test aborted: no API key")
    return
  }

  // Test 2: z.ai connectivity
  console.log("Test 2 — calling z.ai...")
  try {
    const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "glm-4-flash",
        max_tokens: 100,
        messages: [{ role: "system", content: "Respond with exactly: pong" }, { role: "user", content: "ping" }]
      })
    })
    if (!res.ok) throw new Error(res.status + ": " + await res.text())
    const d = await res.json()
    const reply = d?.choices?.[0]?.message?.content ?? ""
    console.log("Test 2 — response:", reply.includes("pong") ? "✅ pong" : "❌ unexpected: " + reply.slice(0,50))
  } catch(e) {
    console.error("Test 2 — ❌ error:", String(e).slice(0,100))
  }

  // Test 3: Russian language
  console.log("Test 3 — Russian language test...")
  try {
    const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "glm-4-flash",
        max_tokens: 100,
        messages: [{ role: "system", content: "Speak Russian briefly" }, { role: "user", content: "скажи привет" }]
      })
    })
    if (!res.ok) throw new Error(res.status + ": " + await res.text())
    const d = await res.json()
    const reply = d?.choices?.[0]?.message?.content ?? ""
    console.log("Test 3 — Russian reply:", reply.length > 0 ? "✅ " + reply.slice(0,50) : "❌ empty")
  } catch(e) {
    console.error("Test 3 — ❌", String(e).slice(0,100))
  }

  console.log("🧪 Self-Test Complete. Check results above.")
}
