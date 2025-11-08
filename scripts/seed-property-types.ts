import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de tipos de propiedad...")

  // 1. Crear tipos de propiedad por defecto
  const propertyTypes = [
    { name: "CASA", description: "Casa unifamiliar" },
    { name: "APARTAMENTO", description: "Apartamento o departamento" },
    { name: "TERRENO", description: "Terreno o lote" },
    { name: "LOCAL_COMERCIAL", description: "Local comercial" },
    { name: "OFICINA", description: "Oficina" },
    { name: "BODEGA", description: "Bodega o almacén" },
  ]

  console.log("📝 Creando tipos de propiedad...")
  for (const type of propertyTypes) {
    const created = await prisma.propertyType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    })
    console.log(`  ✓ ${created.name}`)
  }

  // 2. Obtener el tipo "CASA" por defecto
  const casaType = await prisma.propertyType.findUnique({
    where: { name: "CASA" },
  })

  if (!casaType) {
    throw new Error("No se pudo crear el tipo CASA")
  }

  // 3. Asignar tipo a propiedades sin tipo
  const propertiesWithoutType = await prisma.property.findMany({
    where: { propertyTypeId: null },
  })

  if (propertiesWithoutType.length > 0) {
    console.log(`\n🏠 Asignando tipo a ${propertiesWithoutType.length} propiedades sin tipo...`)
    await prisma.property.updateMany({
      where: { propertyTypeId: null },
      data: { propertyTypeId: casaType.id },
    })
    console.log("  ✓ Propiedades actualizadas")
  }

  // 4. Verificar si hay propiedades sin propietario
  const propertiesWithoutOwner = await prisma.property.findMany({
    where: { ownerId: null },
  })

  if (propertiesWithoutOwner.length > 0) {
    console.log(`\n👤 Encontradas ${propertiesWithoutOwner.length} propiedades sin propietario`)

    // Buscar el primer propietario disponible
    const firstOwner = await prisma.owner.findFirst({
      where: { isActive: true },
    })

    if (firstOwner) {
      console.log(`  Asignando propietario: ${firstOwner.name}`)
      await prisma.property.updateMany({
        where: { ownerId: null },
        data: { ownerId: firstOwner.id },
      })
      console.log("  ✓ Propiedades actualizadas")
    } else {
      console.log("  ⚠️  No hay propietarios en la base de datos")
      console.log("  💡 Crea un propietario primero desde /owners/new")
    }
  }

  console.log("\n✅ Seed completado exitosamente!")
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:")
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
