import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PropertyForm } from "@/components/property-form"
import { WordPressSyncButton } from "@/components/wordpress-sync-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const propertyData = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: true,
    },
  })

  if (!propertyData) {
    notFound()
  }

  if (propertyData.createdById !== user.id && user.role === "VENDEDOR") {
    redirect("/properties")
  }

  const property = {
    ...propertyData,
    owner: propertyData.owner ? { id: propertyData.owner.id, name: propertyData.owner.name } : undefined,
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/properties">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Editar Propiedad</h1>
        <p className="text-muted-foreground">Actualiza la información de la propiedad</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publicar en WordPress</CardTitle>
        </CardHeader>
        <CardContent>
          <WordPressSyncButton
            propertyId={property.id}
            wordpressId={property.wordpressId}
            syncedAt={property.syncedAt}
          />
        </CardContent>
      </Card>

      <PropertyForm editProperty={property} />
    </div>
  )
}
