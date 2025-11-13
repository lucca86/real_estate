"use client"

export default function SimplePage() {
  return (
    <html>
      <head>
        <title>Simple Test</title>
      </head>
      <body style={{ margin: 0, padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Simple Next.js Test</h1>
        <input type="text" placeholder="Escribe aquí" style={{ padding: "10px", fontSize: "16px", width: "300px" }} />
        <button
          onClick={() => alert("Click funciona!")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            marginLeft: "10px",
            cursor: "pointer",
          }}
        >
          Haz Click
        </button>
      </body>
    </html>
  )
}
