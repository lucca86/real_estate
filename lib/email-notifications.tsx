import { generateICS } from "./ics-generator"

interface AppointmentEmailData {
  appointmentId: string
  propertyTitle: string
  propertyAddress: string
  clientName: string
  clientEmail: string
  agentName: string
  agentEmail: string
  scheduledAt: Date
  duration: number
  notes?: string
}

/**
 * Envía notificaciones por email al cliente y al agente sobre una cita
 *
 * NOTA: Esta es una implementación placeholder. Para producción, necesitas:
 * 1. Configurar un servicio de email (Resend, SendGrid, AWS SES, etc.)
 * 2. Agregar las credenciales en las variables de entorno
 * 3. Implementar el envío real de emails
 *
 * Ejemplo con Resend:
 * ```
 * import { Resend } from 'resend'
 * const resend = new Resend(process.env.RESEND_API_KEY)
 * await resend.emails.send({ ... })
 * ```
 */
export async function sendAppointmentNotifications(data: AppointmentEmailData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const endTime = new Date(data.scheduledAt.getTime() + data.duration * 60000)

    // Generar archivo .ics para adjuntar al email
    const icsContent = generateICS({
      title: `Visita a ${data.propertyTitle}`,
      description: `Visita programada a la propiedad: ${data.propertyTitle}\nDirección: ${data.propertyAddress}\n${data.notes ? `Notas: ${data.notes}` : ""}`,
      location: data.propertyAddress,
      startTime: data.scheduledAt,
      endTime,
      organizerName: data.agentName,
      organizerEmail: data.agentEmail,
      attendeeEmail: data.clientEmail,
      attendeeName: data.clientName,
    })

    // Formatear fecha y hora para el email
    const dateStr = data.scheduledAt.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const timeStr = data.scheduledAt.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Email para el cliente
    const clientEmailContent = `
      <h2>Confirmación de Visita a Propiedad</h2>
      <p>Hola ${data.clientName},</p>
      <p>Tu visita a la propiedad ha sido confirmada:</p>
      <ul>
        <li><strong>Propiedad:</strong> ${data.propertyTitle}</li>
        <li><strong>Dirección:</strong> ${data.propertyAddress}</li>
        <li><strong>Fecha:</strong> ${dateStr}</li>
        <li><strong>Hora:</strong> ${timeStr}</li>
        <li><strong>Duración:</strong> ${data.duration} minutos</li>
        <li><strong>Agente:</strong> ${data.agentName}</li>
      </ul>
      ${data.notes ? `<p><strong>Notas:</strong> ${data.notes}</p>` : ""}
      <p>El archivo adjunto (.ics) te permitirá agregar esta cita a tu calendario (Google Calendar, Outlook, etc.).</p>
      <p>Si necesitas cancelar o reprogramar, por favor contacta a tu agente.</p>
    `

    // Email para el agente
    const agentEmailContent = `
      <h2>Nueva Cita Agendada</h2>
      <p>Hola ${data.agentName},</p>
      <p>Se ha agendado una nueva visita:</p>
      <ul>
        <li><strong>Cliente:</strong> ${data.clientName}</li>
        <li><strong>Propiedad:</strong> ${data.propertyTitle}</li>
        <li><strong>Dirección:</strong> ${data.propertyAddress}</li>
        <li><strong>Fecha:</strong> ${dateStr}</li>
        <li><strong>Hora:</strong> ${timeStr}</li>
        <li><strong>Duración:</strong> ${data.duration} minutos</li>
      </ul>
      ${data.notes ? `<p><strong>Notas:</strong> ${data.notes}</p>` : ""}
      <p>El archivo adjunto (.ics) te permitirá agregar esta cita a tu calendario.</p>
    `

    // TODO: Implementar envío real de emails
    // Por ahora, solo registramos en consola
    console.log("[v0] Email notification (placeholder):")
    console.log("To Client:", data.clientEmail)
    console.log("To Agent:", data.agentEmail)
    console.log("ICS file generated:", icsContent.length, "bytes")

    // Simular envío exitoso
    return { success: true }

    /* 
    // Ejemplo de implementación real con Resend:
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await Promise.all([
      // Email al cliente
      resend.emails.send({
        from: 'noreply@tuinmobiliaria.com',
        to: data.clientEmail,
        subject: `Confirmación de Visita - ${data.propertyTitle}`,
        html: clientEmailContent,
        attachments: [{
          filename: 'visita.ics',
          content: Buffer.from(icsContent).toString('base64'),
        }],
      }),
      
      // Email al agente
      resend.emails.send({
        from: 'noreply@tuinmobiliaria.com',
        to: data.agentEmail,
        subject: `Nueva Cita Agendada - ${data.propertyTitle}`,
        html: agentEmailContent,
        attachments: [{
          filename: 'visita.ics',
          content: Buffer.from(icsContent).toString('base64'),
        }],
      }),
    ])
    
    return { success: true }
    */
  } catch (error) {
    console.error("[v0] Error sending appointment notifications:", error)
    return {
      success: false,
      error: "Error al enviar las notificaciones por email",
    }
  }
}
