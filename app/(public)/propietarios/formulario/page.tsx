import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function PropietariosFormularioPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">¿Tenés una propiedad para vender o alquilar?</h1>
            <p className="text-xl text-muted-foreground">
              En Corrientes Capital o zonas cercanas, incluso el interior de Corrientes y el Chaco
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mahler Propiedades</CardTitle>
              <CardDescription>
                Transformamos tu oportunidad inmobiliaria en una operación segura, transparente y con el respaldo de una
                marca reconocida en el mercado local.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <p>
                  Completá el formulario para publicar un inmueble a continuación y{" "}
                  <strong>nuestro equipo de asesores evaluará la aptitud de tu inmueble</strong> para formar parte de
                  nuestra <strong>cartera exclusiva de propiedades</strong>.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Completá los datos para publicar un inmueble</h2>

                <div className="flex flex-col items-center gap-4">
                  <FileText className="h-16 w-16 text-primary" />
                  <p className="text-center text-muted-foreground">
                    Descargá el formulario en PDF, completalo con tus datos y envialo a nuestro equipo para evaluación
                  </p>
                  <Button size="lg" asChild>
                    <a href="/formulario-propietarios.pdf" download>
                      <FileText className="mr-2 h-5 w-5" />
                      Descargar Formulario PDF
                    </a>
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Una vez completado, enviá el formulario por WhatsApp o email para que nuestro equipo evalúe tu
                    propiedad
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">El formulario incluye los siguientes campos:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Nombre y Apellido:</strong> Nombre y apellido de la persona de contacto con poder para
                    ofrecer el inmueble
                  </li>
                  <li>
                    <strong>Teléfono de Contacto:</strong> Preferiblemente con Whatsapp. Mediante este teléfono nos
                    pondremos en contacto para solicitar más información sobre el inmueble
                  </li>
                  <li>
                    <strong>Tipo de Inmueble:</strong> Seleccioná el tipo de inmueble que deseá ofrecer. Si tenés duda,
                    seleccioná la opción "Otro"
                  </li>
                  <li>
                    <strong>Tipo de operación:</strong> Seleccioná qué tipo de operación deseá realizar con el inmueble.
                    En caso de duda seleccioná "Otro"
                  </li>
                  <li>
                    <strong>Ubicación:</strong> Ingresá todos los datos que tenga sobre la ubicación del inmueble.
                    Dirección, barrio, localidad, provincia, etc
                  </li>
                  <li>
                    <strong>Adrema:</strong> La adrema es opcional pero nos puede ayudar a identificar la ubicación del
                    inmueble
                  </li>
                </ul>
              </div>

              <div className="text-center pt-4">
                <Link href="/" className="text-primary hover:underline">
                  Volver al inicio
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
