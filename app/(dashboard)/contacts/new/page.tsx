import { getAllServices } from "@/lib/actions/contacts"
import { ContactForm } from "@/components/contact-form"

export default async function NewContactPage() {
  const services = await getAllServices()

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Contacto</h1>
        <p className="text-muted-foreground mt-1">Agrega un nuevo contacto a tu agenda</p>
      </div>

      <ContactForm services={services} />
    </div>
  )
}
