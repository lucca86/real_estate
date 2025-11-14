import { LoginForm } from "@/components/login-form"
import { Home } from 'lucide-react'
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Real Estate Manager</span>
          </Link>
          <p className="text-sm text-muted-foreground">Ingresa a tu cuenta para continuar</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
