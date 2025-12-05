import { Copyright } from "lucide-react"

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background py-4 px-6">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Red Estrategia</span>
        <Copyright className="h-4 w-4" />
        <span>2025 Todos los derechos Reservados</span>
      </div>
    </footer>
  )
}
