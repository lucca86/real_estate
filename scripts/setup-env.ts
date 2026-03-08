import * as readline from "readline"
import * as fs from "fs"
import * as path from "path"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupEnv() {
  console.log("\n🔧 Configuración de Variables de Entorno para Desarrollo Local\n")
  console.log("Este asistente te ayudará a configurar tu archivo .env local con la conexión a Neon.\n")

  console.log("📋 PASO 1: Obtener tu URL de Neon")
  console.log("   1. Ve a https://console.neon.tech")
  console.log('   2. Selecciona tu proyecto "real_estate"')
  console.log('   3. Ve a "Connection Details"')
  console.log('   4. Copia la "Connection String" (debe empezar con postgresql://...)\n')

  const databaseUrl = await question("Pega tu Connection String aquí: ")

  if (!databaseUrl || !databaseUrl.startsWith("postgresql://")) {
    console.log('\n❌ Error: La URL debe empezar con "postgresql://"')
    console.log("   Ejemplo: postgresql://username:password@host.neon.tech:5432/database?sslmode=require")
    rl.close()
    return
  }

  console.log("\n📋 PASO 2: Variables de WordPress (opcional para desarrollo local)")
  console.log("   Si quieres sincronizar con WordPress desde tu entorno local, necesitas estas variables:\n")

  const wordpressUrl = await question("WordPress URL (Enter para omitir): ")
  const wordpressUsername = wordpressUrl ? await question("WordPress Username: ") : ""
  const wordpressPassword = wordpressUrl ? await question("WordPress Application Password: ") : ""

  // Crear archivo .env
  const envContent = `# Database Connection (Neon)
DATABASE_URL="${databaseUrl}"
DATABASE_URL_UNPOOLED="${databaseUrl}"

# JWT Secret (genera uno seguro para producción)
JWT_SECRET="dev-secret-key-change-in-production"

# WordPress Integration (opcional)
${wordpressUrl ? `WORDPRESS_API_URL="${wordpressUrl}"` : '# WORDPRESS_API_URL="https://tu-sitio.com/wp-json"'}
${wordpressUsername ? `WORDPRESS_USERNAME="${wordpressUsername}"` : '# WORDPRESS_USERNAME="tu-usuario"'}
${wordpressPassword ? `WORDPRESS_APP_PASSWORD="${wordpressPassword}"` : '# WORDPRESS_APP_PASSWORD="tu-app-password"'}

# Stack Auth (se configuran automáticamente en v0)
# NEXT_PUBLIC_real_estate_STACK_PROJECT_ID="project-id"
# NEXT_PUBLIC_real_estate_STACK_PUBLISHABLE_CLIENT_KEY="client-key"
# real_estate_STACK_SECRET_SERVER_KEY="server-key"
`

  const envPath = path.join(process.cwd(), ".env")
  fs.writeFileSync(envPath, envContent)

  console.log("\n✅ Archivo .env creado correctamente!")
  console.log("\n📝 Próximos pasos:")
  console.log("   1. Ejecuta: npm run db:push")
  console.log("   2. Ejecuta: npm run db:seed")
  console.log("   3. Ejecuta: npm run dev")
  console.log("\n🎉 ¡Listo para desarrollar!\n")

  rl.close()
}

setupEnv().catch(console.error)
