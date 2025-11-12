import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../lib/auth"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...\n")

  // Create admin user
  console.log("👤 Creando usuario administrador...")
  const adminPassword = await hashPassword("admin123")

  const admin = await prisma.user.upsert({
    where: { email: "admin@realestate.com" },
    update: {},
    create: {
      email: "admin@realestate.com",
      name: "Administrador",
      password: adminPassword,
      role: "ADMIN",
      phone: "+54 9 11 1234-5678",
    },
  })

  console.log("✅ Usuario admin creado")

  // Create property types
  console.log("\n🏠 Creando tipos de propiedades...")
  const propertyTypes = [
    { name: "Casa", description: "Casa unifamiliar" },
    { name: "Apartamento", description: "Departamento o apartamento" },
    { name: "Lote", description: "Terreno o lote" },
    { name: "Oficina", description: "Espacio de oficina" },
    { name: "Local Comercial", description: "Local para comercio" },
    { name: "Depósito", description: "Espacio de almacenamiento" },
    { name: "Quinta", description: "Propiedad rural o quinta" },
  ]

  for (const type of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    })
  }

  console.log(`✅ ${propertyTypes.length} tipos de propiedades creados`)

  // Create countries
  console.log("\n🌎 Creando países...")
  const argentina = await prisma.country.upsert({
    where: { code: "AR" },
    update: {},
    create: {
      name: "Argentina",
      code: "AR",
    },
  })

  console.log("✅ País Argentina creado")

  // Create provinces
  console.log("\n🗺️  Creando provincias...")
  const provinces = [
    { name: "Corrientes", countryId: argentina.id },
    { name: "Chaco", countryId: argentina.id },
    { name: "Buenos Aires", countryId: argentina.id },
  ]

  const createdProvinces = []
  for (const province of provinces) {
    const created = await prisma.province.upsert({
      where: {
        name_countryId: {
          name: province.name,
          countryId: province.countryId,
        },
      },
      update: {},
      create: province,
    })
    createdProvinces.push(created)
  }

  console.log(`✅ ${provinces.length} provincias creadas`)

  // Create cities
  console.log("\n🏙️  Creando ciudades...")
  const cities = [
    { name: "Corrientes Capital", provinceId: createdProvinces[0].id },
    { name: "Goya", provinceId: createdProvinces[0].id },
    { name: "Resistencia", provinceId: createdProvinces[1].id },
    { name: "Buenos Aires", provinceId: createdProvinces[2].id },
  ]

  const createdCities = []
  for (const city of cities) {
    const created = await prisma.city.upsert({
      where: {
        name_provinceId: {
          name: city.name,
          provinceId: city.provinceId,
        },
      },
      update: {},
      create: city,
    })
    createdCities.push(created)
  }

  console.log(`✅ ${cities.length} ciudades creadas`)

  // Create neighborhoods
  console.log("\n🏘️  Creando barrios...")
  const neighborhoods = [
    { name: "Centro", cityId: createdCities[0].id },
    { name: "San Benito", cityId: createdCities[0].id },
    { name: "Molina Punta", cityId: createdCities[0].id },
  ]

  for (const neighborhood of neighborhoods) {
    await prisma.neighborhood.upsert({
      where: {
        name_cityId: {
          name: neighborhood.name,
          cityId: neighborhood.cityId,
        },
      },
      update: {},
      create: neighborhood,
    })
  }

  console.log(`✅ ${neighborhoods.length} barrios creados`)

  console.log("\n" + "=".repeat(60))
  console.log("\n✅ Seed completado exitosamente!")
  console.log("\n📧 Credenciales de administrador:")
  console.log("   Email: admin@realestate.com")
  console.log("   Password: admin123")
  console.log("\n⚠️  Por favor cambia la contraseña después del primer login!\n")
}

main()
  .catch((e) => {
    console.error("\n❌ Error durante el seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
