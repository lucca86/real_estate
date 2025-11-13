import { getCurrentUser, hasPermission } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { UserForm } from "@/components/user-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!hasPermission(user, "SUPERVISOR")) {
    redirect("/dashboard")
  }

  const editUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!editUser) {
    notFound()
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
        <h1 className="text-3xl font-bold tracking-tight text-balance">Editar Usuario</h1>
        <p className="text-muted-foreground">Actualiza la información del usuario</p>
      </div>

      <UserForm currentUser={user} editUser={editUser} />
    </div>
  )
}
