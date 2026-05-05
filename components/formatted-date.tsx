"use client"

/**
 * FormattedDate — renders a locale-aware date string only on the client.
 *
 * Using suppressHydrationWarning tells React to skip the hydration check for
 * this specific node. The server renders an empty string; the client fills it
 * in after mount. This prevents the hydration mismatch caused by locale
 * differences between Node.js (server) and the browser.
 */

import { useEffect, useState } from "react"

interface FormattedDateProps {
  date: string | Date | null | undefined
  /** Include time (HH:MM) in the output. Defaults to false. */
  showTime?: boolean
  className?: string
}

function format(date: string | Date, showTime: boolean): string {
  const d = typeof date === "string" ? new Date(date) : date
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(showTime && { hour: "2-digit", minute: "2-digit" }),
  }
  return d.toLocaleString("es-AR", opts)
}

export function FormattedDate({ date, showTime = false, className }: FormattedDateProps) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    if (date) setLabel(format(date, showTime))
  }, [date, showTime])

  if (!date) return null

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  )
}
