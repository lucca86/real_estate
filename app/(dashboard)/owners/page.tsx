import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getOwners } from "@/lib/actions/owners"
import { Button } from "@/components/ui/button"
import { Plus, User, Mail, Phone, Building2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function OwnersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getOwners()

  if (!result.success || !result.data) {
    return (
      <DashboardLayout user={user}>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Error al cargar propietarios</p>
        </div>
      </DashboardLayout>
    )
  }

  const owners = result.data

  return (
    <DashboardLayout user={user}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Propietarios</h1>
            <p className="text-muted-foreground">Gestiona los propietarios de las propiedades</p>
          </div>
          <Button asChild>
            <Link href="/owners/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Propietario
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {owners.map((owner) => (
            <Link key={owner.id} href={`/owners/${owner.id}/edit`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{owner.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{owner._count.properties} propiedades</Badge>
                  </div>
                  {owner.city && owner.state && (
                    <CardDescription className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {owner.city}, {owner.state}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {owner.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {owner.phone}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {owners.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No hay propietarios registrados</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">Comienza agregando tu primer propietario</p>
              <Button asChild>
                <Link href="/owners/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Propietario
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
