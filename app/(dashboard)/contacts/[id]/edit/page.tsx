import { getContactById, getAllServices } from "@/lib/actions/contacts"
import { ContactForm } from "@/components/contact-form"
import { notFound } from "next/navigation"

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [contact, services] = await Promise.all([getContactById(id), getAllServices()])

  if (!contact) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Contacto</h1>
        <p className="text-muted-foreground mt-1">
          {contact.lastName}, {contact.firstName}
        </p>
      </div>

      <ContactForm services={services} contact={contact} />
    </div>
  )
}
