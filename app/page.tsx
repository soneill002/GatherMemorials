// This is the homepage at route `/`. Keep it super simple for now so you can verify deploys.
// We’ll replace this with your real design once Figma is ready.

export default function Home() {
  return (
    <main
      style={{
        padding: '3rem 1.25rem',
        maxWidth: 960,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>
        Honor a life in the Catholic tradition
      </h1>

      <p style={{ marginTop: 12, color: '#475569' /* slate-600-ish */ }}>
        Create a beautiful memorial with prayers, virtual candles, and parish support.
      </p>

      <a
        href="#"
        // Later, change this to link to /memorials/new once that route exists.
        style={{
          display: 'inline-block',
          marginTop: 24,
          padding: '12px 18px',
          background: '#1A3C8C' /* Marian blue */,
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Create a Memorial
      </a>
    </main>
  )
}
