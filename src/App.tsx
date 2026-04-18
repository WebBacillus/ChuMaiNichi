import { useState, useEffect, lazy, Suspense } from "react"
import PasswordGate from "./components/PasswordGate"
import { getPassword, authHeaders } from "./lib/auth"
import { triggerRefresh } from "./lib/api"
import { APP_CONFIG } from "./lib/config"

const Heatmap = lazy(() => import("./components/Heatmap"))

function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const pwd = getPassword()
    if (!pwd) {
      fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: "SELECT 1" }),
      }).then((res) => {
        setAuthed(res.status !== 401)
      }).catch(() => setAuthed(false))
      return
    }
    fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sql: "SELECT 1" }),
    }).then((res) => {
      setAuthed(res.status !== 401)
    }).catch(() => setAuthed(false))
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const { run_url } = await triggerRefresh()
      window.open(run_url, "_blank")
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }

  if (authed === null) return (
    <div className="app-loading" aria-label="Checking authentication">
      <span className="app-loading-text">ChuMaiNichi</span>
    </div>
  )
  if (!authed) return <PasswordGate onAuthenticated={() => setAuthed(true)} />

  return (
    <div className="app-container">
      <h1 className="app-title">
        ChuMaiNichi
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Trigger user data refresh"
        >
          {refreshing ? "⟳" : "↻"}
        </button>
      </h1>
      <Suspense fallback={
        <div className="heatmap-skeleton" aria-label="Loading">
          {APP_CONFIG.games.map((g) => (
            <div key={g} className="heatmap-skeleton-block">
              <div className="heatmap-skeleton-title" />
              <div className="heatmap-skeleton-grid" />
            </div>
          ))}
        </div>
      }>
        <Heatmap games={APP_CONFIG.games} />
      </Suspense>
    </div>
  )
}

export default App
