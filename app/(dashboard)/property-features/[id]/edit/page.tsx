import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PropertyFeatureForm } from "@/components/property-feature-form"
import { updatePropertyFeature } from "@/lib/actions/property-features"

export default async function EditPropertyFeaturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: feature, error } = await supabase.from("property_features").select("*").eq("id", id).single()

  if (error || !feature) {
    notFound()
  }

  async function handleUpdate(formData: FormData) {
    "use server"
    await updatePropertyFeature(id, formData)
    redirect("/property-features")
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Editar Característica/Amenidad</h1>
        <PropertyFeatureForm feature={feature} action={handleUpdate} />
      </div>
    </div>
  )
}
