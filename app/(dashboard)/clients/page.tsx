import Link from "next/link"
import { Plus, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getClients } from "@/lib/actions/clients"
import { DeleteClientButton } from "@/components/delete-client-button"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function ClientsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getClients()

  if (!result.success || !result.data) {
    return (
      <DashboardLayout user={user}>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Error al cargar clientes</p>
        </div>
      </DashboardLayout>
    )
  }

  const clients = result.data

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tu base de clientes potenciales</p>
          </div>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Link>
          </Button>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No hay clientes registrados</p>
              <Button asChild className="mt-4">
                <Link href="/clients/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer cliente
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{client.name}</CardTitle>
                      {client.occupation && <CardDescription className="mt-1">{client.occupation}</CardDescription>}
                    </div>
                    <Badge variant={client.isActive ? "default" : "secondary"}>
                      {client.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {client.city}
                          {client.state && `, ${client.state}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{client._count.appointments} citas</span>
                    </div>
                  </div>

                  {client.budget && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Presupuesto</p>
                      <p className="text-lg font-semibold">${client.budget.toLocaleString("es-DO")}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href={`/clients/${client.id}/edit`}>Editar</Link>
                    </Button>
                    <DeleteClientButton clientId={client.id} clientName={client.name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
