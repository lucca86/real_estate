import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit } from "lucide-react"
import Link from "next/link"
import { DeleteUserButton } from "@/components/delete-user-button"
import type { SessionUser } from "@/lib/auth"

interface UsersTableProps {
  currentUser: SessionUser
}

export async function UsersTable({ currentUser }: UsersTableProps) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
      isActive: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  })

  const roleColors = {
    ADMIN: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    SUPERVISOR: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    VENDEDOR: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  }

  const roleLabels = {
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    VENDEDOR: "Vendedor",
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  2FA
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.twoFactorEnabled ? "default" : "outline"}>
                      {user.twoFactorEnabled ? "Habilitado" : "Deshabilitado"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/users/${user.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      {currentUser.id !== user.id && currentUser.role === "ADMIN" && (
                        <DeleteUserButton userId={user.id} userName={user.name} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
