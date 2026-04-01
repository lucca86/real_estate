import { neon } from "@neondatabase/serverless"
import * as readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

async function main() {
  console.log("\n🚀 Real Estate Management - Configuración Rápida\n")
  console.log("Esta herramienta te ayudará a configurar tu proyecto paso a paso.\n")

  // Verificar si existe DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log("❌ No se encontró DATABASE_URL en tu archivo .env\n")
    console.log("📝 Necesitas crear un archivo .env con tu URL de conexión de Neon.\n")

    const hasNeonAccount = await question("¿Ya tienes una cuenta en Neon? (s/n): ")

    if (hasNeonAccount.toLowerCase() !== "s") {
      console.log("\n1. Ve a https://neon.tech y crea una cuenta gratis")
      console.log("2. Crea un nuevo proyecto")
      console.log("3. Copia la Connection String\n")
      process.exit(0)
    }

    console.log("\n📋 Sigue estos pasos:")
    console.log("1. Ve a https://console.neon.tech")
    console.log("2. Selecciona tu proyecto")
    console.log("3. Ve a Connection Details")
    console.log("4. Copia el Connection String\n")

    const dbUrl = await question("Pega tu DATABASE_URL aquí: ")

    if (!dbUrl) {
      console.log("\n❌ DATABASE_URL es requerido. Saliendo...\n")
      process.exit(1)
    }

    console.log("\n✅ URL recibida. Ahora crea un archivo .env con este contenido:\n")
    console.log('DATABASE_URL="' + dbUrl + '"')
    console.log('DATABASE_URL_UNPOOLED="' + dbUrl + '"')
    console.log('JWT_SECRET="' + generateRandomSecret() + '"\n')

    const createEnv = await question("¿Quieres que lo cree automáticamente? (s/n): ")

    if (createEnv.toLowerCase() === "s") {
      const fs = require("fs")
      const envContent = `DATABASE_URL="${dbUrl}"\nDATABASE_URL_UNPOOLED="${dbUrl}"\nJWT_SECRET="${generateRandomSecret()}"\n`
      fs.writeFileSync(".env", envContent)
      console.log("\n✅ Archivo .env creado exitosamente!\n")
    }

    console.log("Ahora ejecuta: npm install")
    console.log("Y luego: npm run db:setup\n")
    process.exit(0)
  }

  // Si existe DATABASE_URL, verificar conexión
  console.log("🔍 Verificando conexión a la base de datos...\n")

  try {
    const sql = neon(process.env.DATABASE_URL)
    await sql`SELECT 1`
    console.log("✅ Conexión exitosa!\n")
  } catch (error) {
    console.log("❌ No se pudo conectar a la base de datos")
    console.log("Error:", error instanceof Error ? error.message : "Unknown error")
    console.log("\nVerifica que:")
    console.log("- La URL sea correcta")
    console.log("- Incluya ?sslmode=require al final")
    console.log("- Tu IP esté permitida en Neon Console\n")
    process.exit(1)
  }

  // Verificar si las tablas existen
  const sql = neon(process.env.DATABASE_URL)
  const tables = await sql`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `

  if (tables.length === 0) {
    console.log("📦 No se encontraron tablas. ¿Quieres inicializar la base de datos?\n")
    const initialize = await question("Esto creará todas las tablas y datos iniciales (s/n): ")

    if (initialize.toLowerCase() === "s") {
      console.log("\n🔨 Inicializando base de datos...\n")
      console.log("Ejecuta: npm run db:setup\n")
    }
  } else {
    console.log(`✅ Se encontraron ${tables.length} tablas en la base de datos\n`)

    // Mostrar tablas
    console.log("Tablas encontradas:")
    tables.forEach((table: any) => {
      console.log(`  - ${table.tablename}`)
    })
    console.log("")
  }

  rl.close()
}

function generateRandomSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let secret = ""
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

main().catch(console.error)
