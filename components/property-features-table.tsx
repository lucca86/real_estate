"use client"

import {
  type PropertyFeature,
  deletePropertyFeature,
  togglePropertyFeatureStatus,
} from "@/lib/actions/property-features"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trash2, Edit } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function PropertyFeaturesTable({
  features,
  initialStatus,
}: {
  features: PropertyFeature[]
  initialStatus?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    initialStatus === "active" ? "active" : initialStatus === "inactive" ? "inactive" : "all",
  )
  const [localFeatures, setLocalFeatures] = useState<PropertyFeature[]>(features)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await deletePropertyFeature(deleteId)
      setLocalFeatures((prev) => prev.filter((f) => f.id !== deleteId))
      toast({
        title: "Característica eliminada",
        description: "La característica se eliminó exitosamente",
      })
      setDeleteId(null)
      router.refresh()
    } catch (error) {
      console.error("Error deleting feature:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la característica",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async (feature: PropertyFeature) => {
    setTogglingId(feature.id)
    const newStatus = !feature.is_active

    // Actualizar estado local optimistamente
    setLocalFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, is_active: newStatus } : f)))

    try {
      const result = await togglePropertyFeatureStatus(feature.id, newStatus)

      if (result.success) {
        toast({
          title: "Estado actualizado",
          description: `La característica ahora está ${newStatus ? "activa" : "inactiva"}`,
        })
        router.refresh()
      } else {
        // Revertir si falló
        setLocalFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, is_active: !newStatus } : f)))
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating feature:", error)
      // Revertir cambio local
      setLocalFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, is_active: !newStatus } : f)))
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setTogglingId(null)
    }
  }

  const filteredFeatures = localFeatures.filter((f) => {
    if (statusFilter === "active") return f.is_active
    if (statusFilter === "inactive") return !f.is_active
    return true
  })

  const caracteristicas = filteredFeatures.filter((f) => f.type === "CARACTERISTICA")
  const amenidades = filteredFeatures.filter((f) => f.type === "AMENIDAD")

  return (
    <>
      <div className="mb-6 flex gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
          size="sm"
        >
          Todas ({localFeatures.length})
        </Button>
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          onClick={() => setStatusFilter("active")}
          size="sm"
        >
          Activas ({localFeatures.filter((f) => f.is_active).length})
        </Button>
        <Button
          variant={statusFilter === "inactive" ? "default" : "outline"}
          onClick={() => setStatusFilter("inactive")}
          size="sm"
        >
          Inactivas ({localFeatures.filter((f) => !f.is_active).length})
        </Button>
      </div>

      <div className="space-y-8">
        {caracteristicas.length === 0 && amenidades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay características o amenidades que coincidan con el filtro seleccionado
          </div>
        ) : (
          <>
            {caracteristicas.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Características</h2>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Nombre</TableHead>
                        <TableHead className="w-[30%] text-center">Estado</TableHead>
                        <TableHead className="w-[20%] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caracteristicas.map((feature) => (
                        <TableRow key={feature.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{feature.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-3">
                              <Switch
                                checked={feature.is_active}
                                onCheckedChange={() => handleToggleActive(feature)}
                                disabled={togglingId === feature.id}
                              />
                              <Badge
                                variant={feature.is_active ? "default" : "secondary"}
                                className="min-w-[70px] justify-center"
                              >
                                {feature.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/property-features/${feature.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(feature.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {amenidades.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Amenidades</h2>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Nombre</TableHead>
                        <TableHead className="w-[30%] text-center">Estado</TableHead>
                        <TableHead className="w-[20%] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amenidades.map((feature) => (
                        <TableRow key={feature.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{feature.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-3">
                              <Switch
                                checked={feature.is_active}
                                onCheckedChange={() => handleToggleActive(feature)}
                                disabled={togglingId === feature.id}
                              />
                              <Badge
                                variant={feature.is_active ? "default" : "secondary"}
                                className="min-w-[70px] justify-center"
                              >
                                {feature.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/property-features/${feature.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(feature.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la característica.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
