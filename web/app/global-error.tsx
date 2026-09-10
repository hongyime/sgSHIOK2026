"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <head><title>SHIOK | Page unavailable</title></head>
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box", background: "#f8faf9", color: "#182b28", fontFamily: "system-ui, sans-serif", letterSpacing: 0 }}>
        <main style={{ width: "100%", maxWidth: 360 }}>
          <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>SHIOK couldn&apos;t load</h1>
          <p style={{ margin: "0 0 24px", fontSize: 16, lineHeight: 1.5 }}>Reload the page to try again.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: "12px 18px", border: "1px solid #006e64", borderRadius: 6, background: "#007e72", color: "#ffffff", font: "inherit", cursor: "pointer", minHeight: 44 }}>
            Reload page
          </button>
        </main>
      </body>
    </html>
  );
}
