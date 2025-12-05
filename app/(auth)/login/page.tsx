import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/images/logo-dark.png"
              alt="Gestión Inmobiliaria RE"
              width={300}
              height={80}
              className="h-auto w-auto max-w-[280px]"
              priority
            />
          </Link>
          <p className="text-sm text-muted-foreground">Ingresa a tu cuenta para continuar</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
