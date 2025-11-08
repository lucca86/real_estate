// Utilidad para generar archivos .ics (iCalendar) para Google Calendar y Outlook

interface ICSEvent {
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  organizerName: string
  organizerEmail: string
  attendeeEmail: string
  attendeeName: string
}

// Formatear fecha para formato iCalendar (YYYYMMDDTHHMMSSZ)
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

// Escapar caracteres especiales en el contenido del ICS
function escapeICSText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

// Generar contenido del archivo .ics
export function generateICS(event: ICSEvent): string {
  const now = new Date()
  const uid = `${now.getTime()}@realestateapp.com`

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Real Estate Management//Appointment//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.description)}`,
    `LOCATION:${escapeICSText(event.location)}`,
    `ORGANIZER;CN=${escapeICSText(event.organizerName)}:mailto:${event.organizerEmail}`,
    `ATTENDEE;CN=${escapeICSText(event.attendeeName)};RSVP=TRUE:mailto:${event.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio: Visita a propiedad en 24 horas",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  return icsContent
}

// Generar archivo .ics como Blob para descarga
export function generateICSBlob(event: ICSEvent): Blob {
  const icsContent = generateICS(event)
  return new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
}

// Generar nombre de archivo para el .ics
export function generateICSFilename(propertyTitle: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0]
  const sanitizedTitle = propertyTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)

  return `visita-${sanitizedTitle}-${dateStr}.ics`
}
