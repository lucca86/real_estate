import { getCurrentUser, isAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WordPressBulkSync } from "@/components/wordpress-bulk-sync"
import { WordPressTestConnection } from "@/components/wordpress-test-connection"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, MapPin } from "lucide-react" // Added MapPin icon
import Link from "next/link" // Added Link import
import { Button } from "@/components/ui/button" // Added Button import

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!isAdmin(user)) {
    redirect("/dashboard")
  }

  const hasWordPressConfig = !!(
    process.env.WORDPRESS_API_URL &&
    process.env.WORDPRESS_USERNAME &&
    process.env.WORDPRESS_APP_PASSWORD
  )

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración del sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gestión de Ubicaciones
            </CardTitle>
            <CardDescription>Administra países, provincias, ciudades y barrios para las propiedades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Gestiona las ubicaciones disponibles para asignar a las propiedades. Puedes crear, editar y eliminar
                países, provincias, ciudades y barrios.
              </p>
              <div>
                <Button asChild>
                  <Link href="/locations">
                    <MapPin className="mr-2 h-4 w-4" />
                    Ir a Gestión de Ubicaciones
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integración con WordPress</CardTitle>
            <CardDescription>
              Sincroniza las propiedades con tu sitio WordPress usando el plugin Major Estatik
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasWordPressConfig && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuración requerida</AlertTitle>
                <AlertDescription>
                  Para usar la integración con WordPress, configura las siguientes variables de entorno:
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Variables de Entorno</h3>
                <div className="space-y-2 text-sm bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WORDPRESS_API_URL</span>
                    <span className="font-mono text-xs">{process.env.WORDPRESS_API_URL || "No configurado"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WORDPRESS_USERNAME</span>
                    <span className="font-mono text-xs">{process.env.WORDPRESS_USERNAME || "No configurado"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">WORDPRESS_APP_PASSWORD</span>
                    <span className="font-mono text-xs">
                      {process.env.WORDPRESS_APP_PASSWORD ? "••••••••" : "No configurado"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Instrucciones de Configuración</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>WORDPRESS_API_URL:</strong> URL de tu sitio WordPress seguida de{" "}
                    <code className="bg-muted px-1 rounded">/wp-json</code>
                    <br />
                    <span className="ml-6 text-xs">
                      Ejemplo: <code className="bg-muted px-1 rounded">https://tusitio.com/wp-json</code>
                    </span>
                  </li>
                  <li>
                    <strong>WORDPRESS_USERNAME:</strong> Tu nombre de usuario de WordPress (debe tener rol de Editor o
                    Administrador)
                  </li>
                  <li>
                    <strong>WORDPRESS_APP_PASSWORD:</strong> Genera un Application Password en WordPress:
                    <ul className="ml-6 mt-1 space-y-1 text-xs list-disc list-inside">
                      <li>Ve a Usuarios → Perfil en tu panel de WordPress</li>
                      <li>Desplázate hasta "Contraseñas de aplicación"</li>
                      <li>Crea una nueva contraseña con un nombre descriptivo</li>
                      <li>Copia la contraseña generada (sin espacios)</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {hasWordPressConfig && (
                <div>
                  <h3 className="font-semibold mb-2">Probar Conexión</h3>
                  <WordPressTestConnection />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {hasWordPressConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Sincronización Masiva</CardTitle>
              <CardDescription>Sincroniza todas las propiedades publicadas con WordPress</CardDescription>
            </CardHeader>
            <CardContent>
              <WordPressBulkSync />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
