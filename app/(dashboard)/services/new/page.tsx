import { ServiceForm } from "@/components/service-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewServicePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Servicio</h1>
        <p className="text-muted-foreground">Agrega un nuevo servicio a la agenda de contactos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  )
}
