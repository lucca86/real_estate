#!/usr/bin/env tsx

import { neon } from "@neondatabase/serverless"
import * as readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log("\n🚀 Configuración de Entorno Local con Neon\n")
  console.log("Este asistente te ayudará a configurar tu entorno de desarrollo local.\n")

  // Verificar si ya existe .env.local
  try {
    const fs = await import("fs")
    if (fs.existsSync(".env.local")) {
      console.log("✅ Archivo .env.local encontrado\n")

      const overwrite = await question("¿Deseas sobrescribirlo? (s/n): ")
      if (overwrite.toLowerCase() !== "s") {
        console.log("\n✅ Usando archivo .env.local existente")
        await verifyConnection()
        return
      }
    }
  } catch (error) {
    // Continuar si no se puede verificar el archivo
  }

  console.log("\n📋 Opciones de configuración:\n")
  console.log("1. Descargar variables de Vercel (requiere Vercel CLI)")
  console.log("2. Ingresar variables manualmente")
  console.log("3. Salir\n")

  const option = await question("Selecciona una opción (1-3): ")

  switch (option) {
    case "1":
      await downloadFromVercel()
      break
    case "2":
      await manualSetup()
      break
    case "3":
      console.log("\n👋 ¡Hasta luego!")
      process.exit(0)
    default:
      console.log("\n❌ Opción inválida")
      process.exit(1)
  }

  rl.close()
}

async function downloadFromVercel() {
  console.log("\n📥 Descargando variables de Vercel...\n")

  const { exec } = await import("child_process")
  const { promisify } = await import("util")
  const execAsync = promisify(exec)

  try {
    // Verificar si Vercel CLI está instalado
    await execAsync("vercel --version")
    console.log("✅ Vercel CLI encontrado")
  } catch (error) {
    console.log("\n❌ Vercel CLI no está instalado")
    console.log("\nInstálalo con: npm install -g vercel")
    process.exit(1)
  }

  try {
    // Link al proyecto si no está linkeado
    console.log("\n🔗 Vinculando al proyecto de Vercel...")
    await execAsync("vercel link")

    // Descargar variables
    console.log("\n📥 Descargando variables de entorno...")
    await execAsync("vercel env pull .env.local")

    console.log("\n✅ Variables de entorno descargadas correctamente")

    await verifyConnection()
  } catch (error) {
    console.log("\n❌ Error al descargar variables de Vercel")
    console.log("Error:", error)
    process.exit(1)
  }
}

async function manualSetup() {
  console.log("\n📝 Configuración Manual\n")
  console.log("Ve a tu proyecto en Vercel Dashboard:")
  console.log("https://vercel.com/dashboard\n")
  console.log("Settings → Environment Variables\n")

  const databaseUrl = await question("DATABASE_URL: ")
  const databaseUrlUnpooled = await question("DATABASE_URL_UNPOOLED (opcional, presiona Enter para omitir): ")
  const jwtSecret = await question("JWT_SECRET: ")

  const wpUrl = await question("WORDPRESS_API_URL (opcional, presiona Enter para omitir): ")
  let wpUsername = ""
  let wpPassword = ""

  if (wpUrl) {
    wpUsername = await question("WORDPRESS_USERNAME: ")
    wpPassword = await question("WORDPRESS_APP_PASSWORD: ")
  }

  // Crear archivo .env.local
  let envContent = `# Base de datos Neon
DATABASE_URL="${databaseUrl}"
`

  if (databaseUrlUnpooled) {
    envContent += `DATABASE_URL_UNPOOLED="${databaseUrlUnpooled}"\n`
  }

  envContent += `\n# JWT
JWT_SECRET="${jwtSecret}"
`

  if (wpUrl) {
    envContent += `\n# WordPress
WORDPRESS_API_URL="${wpUrl}"
WORDPRESS_USERNAME="${wpUsername}"
WORDPRESS_APP_PASSWORD="${wpPassword}"
`
  }

  try {
    const fs = await import("fs")
    fs.writeFileSync(".env.local", envContent)
    console.log("\n✅ Archivo .env.local creado correctamente")

    await verifyConnection()
  } catch (error) {
    console.log("\n❌ Error al crear archivo .env.local")
    console.log("Error:", error)
    process.exit(1)
  }
}

async function verifyConnection() {
  console.log("\n🔍 Verificando conexión a Neon...\n")

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.log("❌ DATABASE_URL no encontrada")
    console.log("\nAsegúrate de que el archivo .env.local esté en la raíz del proyecto")
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)
    const result = await sql`SELECT version()`

    console.log("✅ Conexión exitosa a Neon")
    console.log("Versión de PostgreSQL:", result[0].version.split(" ")[1])

    // Verificar tablas existentes
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log(`\n📊 Tablas encontradas: ${tables.length}`)

    if (tables.length === 0) {
      console.log("\n⚠️  La base de datos está vacía")
      console.log("\nEjecuta: npm run db:setup para inicializar la base de datos")
    } else {
      console.log("\nTablas:")
      tables.forEach((t: any) => console.log(`  - ${t.table_name}`))

      // Verificar si necesita migraciones
      const expectedTables = [
        "User",
        "Session",
        "Property",
        "Owner",
        "Client",
        "PropertyType",
        "Appointment",
        "Country",
        "Province",
        "City",
        "Neighborhood",
      ]

      const existingTableNames = tables.map((t: any) => t.table_name)
      const missingTables = expectedTables.filter((t) => !existingTableNames.includes(t))

      if (missingTables.length > 0) {
        console.log("\n⚠️  Faltan algunas tablas:")
        missingTables.forEach((t) => console.log(`  - ${t}`))
        console.log("\nEjecuta: npm run db:setup para crear las tablas faltantes")
      } else {
        console.log("\n✅ Todas las tablas necesarias están presentes")
      }
    }

    console.log("\n🎉 Configuración completada!")
    console.log("\nPróximos pasos:")
    console.log("  1. npm run dev          → Iniciar servidor de desarrollo")
    console.log("  2. npm run db:status    → Ver estado de la base de datos")
    console.log("  3. npx prisma studio    → Abrir editor visual de base de datos")
  } catch (error) {
    console.log("\n❌ Error al conectar con Neon")
    console.log("Error:", error)
    console.log("\nVerifica que la URL de conexión sea correcta")
    process.exit(1)
  }
}

main().catch(console.error)
