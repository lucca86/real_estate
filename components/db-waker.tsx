"use client"

import { useEffect, useState } from "react"

export function DbWaker() {
  const [status, setStatus] = useState<"waking" | "ready" | "error">("waking")

  useEffect(() => {
    const wakeDb = async () => {
      try {
        console.log("[v0] DbWaker: Waking up database...")
        const response = await fetch("/api/db/wake")
        const data = await response.json()

        if (data.success) {
          console.log("[v0] DbWaker: Database is awake!")
          setStatus("ready")
        } else {
          console.error("[v0] DbWaker: Failed to wake database:", data.error)
          setStatus("error")
        }
      } catch (error) {
        console.error("[v0] DbWaker: Error:", error)
        setStatus("error")
      }
    }

    wakeDb()
  }, [])

  // Don't render anything visible
  return null
}
