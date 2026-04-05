import { useState, useEffect } from "react"
import Heatmap from "./components/Heatmap"
import PasswordGate from "./components/PasswordGate"
import { getPassword, authHeaders } from "./lib/auth"

function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const pwd = getPassword()
    if (!pwd) {
      // No stored password — check if auth is even required
      fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: "SELECT 1" }),
      }).then((res) => {
        setAuthed(res.status !== 401)
      }).catch(() => setAuthed(false))
      return
    }
    // Validate stored password
    fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sql: "SELECT 1" }),
    }).then((res) => {
      setAuthed(res.status !== 401)
    }).catch(() => setAuthed(false))
  }, [])

  if (authed === null) return null // loading
  if (!authed) return <PasswordGate onAuthenticated={() => setAuthed(true)} />

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>ChuMaiNichi</h1>
      <Heatmap games={["maimai", "chunithm"]} />
    </div>
  )
}

export default App
