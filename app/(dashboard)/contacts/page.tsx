import { Suspense } from "react"
import { getAllContacts, getAllServices } from "@/lib/actions/contacts"
import { ContactsTable } from "@/components/contacts-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default async function ContactsPage() {
  const [contacts, services] = await Promise.all([getAllContacts(), getAllServices()])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agenda de Contactos</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu red de contactos y proveedores de servicios</p>
        </div>
        <Link href="/contacts/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando contactos...</div>}>
        <ContactsTable contacts={contacts} services={services} />
      </Suspense>
    </div>
  )
}
