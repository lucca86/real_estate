"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { updatePermissions, resetRolePermissions, type PermissionUpdate } from "@/lib/actions/permissions"
import { PERMISSION_GROUPS } from "@/lib/permissions-config"
import { Loader2, RotateCcw, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

const ROLES = [
  { value: "ADMIN", label: "Administrador", color: "bg-red-500" },
  { value: "SUPERVISOR", label: "Supervisor", color: "bg-blue-500" },
  { value: "VENDEDOR", label: "Agente Inmobiliario", color: "bg-green-500" },
]

interface PermissionsState {
  [role: string]: {
    [permission: string]: boolean
  }
}

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<PermissionsState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetRole, setResetRole] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadPermissions()
  }, [])

  async function loadPermissions() {
    try {
      const response = await fetch("/api/permissions")
      const data = await response.json()

      if (data.permissions) {
        setPermissions(data.permissions)
      }
    } catch (error) {
      console.error("Error loading permissions:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function togglePermission(role: string, permission: string) {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: !prev[role]?.[permission],
      },
    }))
  }

  async function handleSave() {
    setSaving(true)

    try {
      const updates: PermissionUpdate[] = []

      // Compare current state with original and build updates
      for (const role of ROLES) {
        for (const group of PERMISSION_GROUPS) {
          for (const perm of group.permissions) {
            updates.push({
              role: role.value,
              permission: perm.key,
              enabled: permissions[role.value]?.[perm.key] || false,
            })
          }
        }
      }

      const result = await updatePermissions(updates)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Permisos actualizados",
          description: "Los cambios se aplicaron correctamente",
        })
        await loadPermissions()
      }
    } catch (error) {
      console.error("Error saving permissions:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleReset(role: string) {
    try {
      const result = await resetRolePermissions(role)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Permisos restaurados",
          description: `Los permisos de ${ROLES.find((r) => r.value === role)?.label} fueron restaurados a sus valores predeterminados`,
        })
        await loadPermissions()
      }
    } catch (error) {
      console.error("Error resetting permissions:", error)
      toast({
        title: "Error",
        description: "No se pudieron restaurar los permisos",
        variant: "destructive",
      })
    } finally {
      setResetRole(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permisos</CardTitle>
          <CardDescription>
            Define qué acciones puede realizar cada rol en el sistema. Los cambios se aplican inmediatamente a todos los
            usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Header with role badges */}
            <div className="grid grid-cols-[300px_repeat(3,1fr)] gap-4 items-center">
              <div className="font-medium text-sm text-muted-foreground">Permiso</div>
              {ROLES.map((role) => (
                <div key={role.value} className="text-center">
                  <Badge className={`${role.color} text-white`}>{role.label}</Badge>
                  {role.value !== "ADMIN" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => setResetRole(role.value)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restaurar
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Permissions grid */}
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.name} className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground border-b pb-2">{group.label}</h3>

                {group.permissions.map((perm) => (
                  <div
                    key={perm.key}
                    className="grid grid-cols-[300px_repeat(3,1fr)] gap-4 items-center py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{perm.label}</div>
                      {perm.description && <div className="text-xs text-muted-foreground">{perm.description}</div>}
                    </div>

                    {ROLES.map((role) => {
                      const isChecked = permissions[role.value]?.[perm.key] || false
                      const isDisabled = false

                      return (
                        <div key={role.value} className="flex justify-center">
                          <Checkbox
                            checked={isChecked}
                            disabled={isDisabled}
                            onCheckedChange={() => togglePermission(role.value, perm.key)}
                            className="h-5 w-5"
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirmation dialog */}
      <AlertDialog open={!!resetRole} onOpenChange={() => setResetRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar permisos predeterminados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción restaurará todos los permisos de{" "}
              <span className="font-semibold">{ROLES.find((r) => r.value === resetRole)?.label}</span> a sus valores
              predeterminados. Los cambios se aplicarán inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetRole && handleReset(resetRole)}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
