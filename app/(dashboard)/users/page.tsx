import { getCurrentUser, hasPermission } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersTable } from "@/components/users-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, "SUPERVISOR")) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button asChild>
          <Link href="/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <UsersTable currentUser={user} />
    </div>
  )
}
