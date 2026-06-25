"use client"

import { useEffect } from "react"

// Última red de seguridad: captura errores incluso del layout raíz.
// Evita la pantalla blanca de "Application error" y muestra el detalle real.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#f8fafc",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", color: "#1A3A6B", marginBottom: 8 }}>
            Algo falló al cargar la página
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 16 }}>
            Vuelve a intentarlo. Si el problema sigue, comparte el detalle de abajo.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#1A3A6B",
              color: "white",
              border: 0,
              borderRadius: 8,
              padding: "0.6rem 1.2rem",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <pre
            style={{
              marginTop: 20,
              textAlign: "left",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "0.75rem",
              fontSize: "0.75rem",
              color: "#b91c1c",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message || "Error desconocido"}
            {error.digest ? `\n\nID: ${error.digest}` : ""}
          </pre>
        </div>
      </body>
    </html>
  )
}
