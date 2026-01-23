import { getAppointmentSettings } from "@/lib/actions/appointment-settings"
import { AppointmentSettingsForm } from "@/components/appointment-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ConfiguracionPage() {
  const settings = await getAppointmentSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona los horarios y configuración de citas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios de Atención</CardTitle>
          <CardDescription>
            Configure los horarios disponibles para agendar citas según el tipo de día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  )
}
