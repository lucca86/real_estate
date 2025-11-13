import { getCurrentUser, hasPermission } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserForm } from "@/components/user-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewUserPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, "SUPERVISOR")) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/users">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Nuevo Usuario</h1>
        <p className="text-muted-foreground">Crea un nuevo usuario en el sistema</p>
      </div>

      <UserForm currentUser={user} />
    </div>
  )
}
