function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>ChuMaiNichi</h1>
      <p>Rhythm game dashboard scaffold - components coming soon</p>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>API Stubs</h2>
        <ul>
          <li><code>POST /api/query</code> - Returns mock daily_play rows</li>
          <li><code>POST /api/chat</code> - Returns mock AI response</li>
          <li><code>POST /api/refresh</code> - Returns mock run_url</li>
        </ul>
      </div>
    </div>
  )
}

export default App
