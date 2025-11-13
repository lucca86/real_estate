import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Inicializando base de datos Neon...\n")

  try {
    // Verificar conexión
    await prisma.$connect()
    console.log("✅ Conexión exitosa a Neon\n")

    // Verificar si ya existen datos
    const userCount = await prisma.user.count()

    if (userCount > 0) {
      console.log("⚠️  La base de datos ya tiene datos.")
      console.log('   Ejecuta "npm run db:reset" para empezar desde cero.\n')
      process.exit(0)
    }

    console.log("📦 Creando datos iniciales...\n")

    // Crear usuario administrador
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Administrador",
        password: "$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // admin123
        role: "ADMIN",
        phone: "+54 379 4567890",
        isActive: true,
      },
    })
    console.log("✅ Usuario administrador creado")

    // Crear tipos de propiedad
    const propertyTypes = await prisma.propertyType.createMany({
      data: [
        { name: "Casa", description: "Casa unifamiliar" },
        { name: "Departamento", description: "Departamento en edificio" },
        { name: "Terreno", description: "Terreno baldío" },
        { name: "Local Comercial", description: "Local para comercio" },
        { name: "Oficina", description: "Espacio de oficina" },
        { name: "Galpon", description: "Galpón industrial" },
        { name: "Quinta", description: "Casa quinta" },
        { name: "Campo", description: "Campo rural" },
      ],
    })
    console.log(`✅ ${propertyTypes.count} tipos de propiedad creados`)

    // Crear país Argentina
    const argentina = await prisma.country.create({
      data: {
        name: "Argentina",
        code: "AR",
      },
    })
    console.log("✅ País Argentina creado")

    // Crear provincia Corrientes
    const corrientes = await prisma.province.create({
      data: {
        name: "Corrientes",
        countryId: argentina.id,
      },
    })
    console.log("✅ Provincia Corrientes creada")

    // Crear ciudad Capital
    const capital = await prisma.city.create({
      data: {
        name: "Capital",
        provinceId: corrientes.id,
      },
    })
    console.log("✅ Ciudad Capital creada")

    // Crear barrios
    const neighborhoods = await prisma.neighborhood.createMany({
      data: [
        { name: "Centro", cityId: capital.id },
        { name: "San Martín", cityId: capital.id },
        { name: "Cambá Cuá", cityId: capital.id },
        { name: "Santa Catalina", cityId: capital.id },
        { name: "Molina Punta", cityId: capital.id },
      ],
    })
    console.log(`✅ ${neighborhoods.count} barrios creados`)

    console.log("\n✨ ¡Base de datos inicializada correctamente!\n")
    console.log("📝 Credenciales de acceso:")
    console.log("   Email: admin@example.com")
    console.log("   Password: admin123\n")
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
