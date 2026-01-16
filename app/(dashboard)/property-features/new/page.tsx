import { PropertyFeatureForm } from "@/components/property-feature-form"

export default function NewPropertyFeaturePage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Agregar Característica o Amenidad</h1>
        <PropertyFeatureForm />
      </div>
    </div>
  )
}
