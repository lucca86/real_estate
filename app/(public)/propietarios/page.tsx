import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Home } from "lucide-react"
import Link from "next/link"

export default function PropietariosFormPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Home className="h-5 w-5" />
            Mahler Propiedades
          </Link>
          <Button asChild variant="outline">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance">
              ¿Tenés una propiedad para vender o alquilar en Corrientes Capital o zonas cercanas, incluso el interior de
              Corrientes y el Chaco?
            </h1>
            <div className="mx-auto max-w-2xl space-y-3 text-muted-foreground">
              <p>
                En <strong className="text-foreground">Mahler Propiedades</strong>, transformamos tu oportunidad
                inmobiliaria en una operación segura, transparente y con el respaldo de una marca reconocida en el
                mercado local.
              </p>
              <p>
                Completá el formulario para publicar un inmueble a continuación y{" "}
                <strong className="text-foreground">
                  nuestro equipo de asesores evaluará la aptitud de tu inmueble
                </strong>{" "}
                para formar parte de nuestra{" "}
                <strong className="text-foreground">cartera exclusiva de propiedades</strong>.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Completá los datos para publicar un inmueble</CardTitle>
              <CardDescription className="text-center">
                Toda la información es confidencial y será utilizada únicamente para evaluar tu propiedad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre y Apellido <span className="text-destructive">*</span>
                  </Label>
                  <Input id="nombre" name="nombre" placeholder="Ingresá tu nombre completo" required />
                  <p className="text-sm text-muted-foreground">
                    Nombre y apellido de la persona de contacto con poder para ofrecer el inmueble.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">
                    Teléfono de Contacto (preferiblemente con Whatsapp) <span className="text-destructive">*</span>
                  </Label>
                  <Input id="telefono" name="telefono" type="tel" placeholder="+54 9 379 XXXXXXX" required />
                  <p className="text-sm text-muted-foreground">
                    Mediante este teléfono nos pondremos en contacto para solicitar más información sobre el inmueble.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoInmueble">
                    Tipo de Inmueble <span className="text-destructive">*</span>
                  </Label>
                  <Select name="tipoInmueble" required>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Selecciona la opción --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="local_comercial">Local Comercial</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="galpon">Galpón</SelectItem>
                      <SelectItem value="campo">Campo</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Seleccione el tipo de inmueble que desea ofrecer. Si tiene duda, seleccione la opción "Otro".
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoOperacion">
                    Tipo de operación <span className="text-destructive">*</span>
                  </Label>
                  <Select name="tipoOperacion" required>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Selecciona la opción --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="alquiler">Alquiler</SelectItem>
                      <SelectItem value="venta_alquiler">Venta o Alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Seleccione qué tipo de operación desea realizar con el inmueble. En caso de duda seleccione "Otro".
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion">
                    Ubicación <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="ubicacion"
                    name="ubicacion"
                    placeholder="Ingresá la dirección completa, barrio, localidad, provincia, etc."
                    rows={3}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Ingrese todos los datos que tenga sobre la ubicación del inmueble. Dirección, barrio, localidad,
                    provincia, etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adrema">Adrema</Label>
                  <Input id="adrema" name="adrema" placeholder="Código Adrema (opcional)" />
                  <p className="text-sm text-muted-foreground">
                    La adrema es opcional pero nos puede ayudar a identificar la ubicación del inmueble.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción adicional</Label>
                  <Textarea
                    id="descripcion"
                    name="descripcion"
                    placeholder="Agregá cualquier información adicional que consideres relevante sobre la propiedad..."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Podés agregar información sobre características, estado de la propiedad, servicios disponibles, etc.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                    <a href="/formulario-propietarios.pdf" download>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar formulario PDF
                    </a>
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    Enviar Información
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Al enviar este formulario, aceptás que nos contactemos contigo para evaluar tu propiedad.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Mahler Propiedades. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
