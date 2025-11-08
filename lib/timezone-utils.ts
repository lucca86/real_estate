// El input datetime-local trabaja en la zona horaria local del navegador
// Simplemente convertimos a ISO string sin ajustes complejos

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires"

/**
 * Convierte un string datetime-local a ISO string
 * El datetime-local ya viene en la zona horaria local del usuario
 * Simplemente lo convertimos a ISO string
 */
export function datetimeLocalToISO(datetimeLocal: string): string {
  // El datetime-local viene en formato "YYYY-MM-DDTHH:mm"
  // Simplemente agregamos segundos y convertimos a Date
  const date = new Date(datetimeLocal + ":00")
  return date.toISOString()
}

/**
 * Convierte un Date o ISO string a formato datetime-local
 * Usa la zona horaria de Argentina para mostrar la hora correcta
 */
export function dateToDatetimeLocal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  // Usar Intl.DateTimeFormat para obtener las partes de la fecha en zona horaria de Argentina
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(d)
  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value
  const hour = parts.find((p) => p.type === "hour")?.value
  const minute = parts.find((p) => p.type === "minute")?.value

  return `${year}-${month}-${day}T${hour}:${minute}`
}

/**
 * Formatea una fecha para mostrar en zona horaria de Argentina
 */
export function formatArgentinaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return formatter.format(d)
}

/**
 * Obtiene la hora en formato HH:mm para zona horaria de Argentina
 */
export function getArgentinaTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return formatter.format(d)
}
