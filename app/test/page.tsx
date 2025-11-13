"use client"

export default function TestPage() {
  return (
    <div style={{ padding: "50px", background: "white", color: "black" }}>
      <h1 style={{ marginBottom: "20px" }}>Test Page - Click Test</h1>
      <p style={{ marginBottom: "20px" }}>
        If you can read this and click the button below, your browser is working correctly.
      </p>

      <button
        onClick={() => alert("Button clicked successfully!")}
        style={{
          padding: "15px 30px",
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          marginBottom: "20px",
        }}
      >
        Click Me To Test
      </button>

      <input
        type="text"
        placeholder="Type here to test input"
        style={{
          display: "block",
          width: "300px",
          padding: "10px",
          fontSize: "16px",
          border: "2px solid black",
          marginTop: "20px",
        }}
      />

      <p style={{ marginTop: "30px", color: "green" }}>
        If the button and input work, the problem is with specific components in your app.
      </p>
    </div>
  )
}
