import "dotenv/config"
import { testNeonConnection } from "../lib/db-neon"

async function wakeNeon() {
  console.log("🔄 Intentando despertar la base de datos Neon...")
  console.log("")

  const result = await testNeonConnection()

  if (result.success) {
    console.log("✅ ¡Base de datos Neon despierta y funcionando!")
    console.log("📊 Información del servidor:", result.data)
    console.log("")
    console.log("Ahora puedes ejecutar tu aplicación con: npm run dev")
    process.exit(0)
  } else {
    console.log("❌ Error al conectar con Neon:")
    console.log(result.error)
    console.log("")
    console.log("Posibles causas:")
    console.log("1. La base de datos aún está despertando (espera 10-20 segundos)")
    console.log("2. Las credenciales en .env son incorrectas")
    console.log("3. La base de datos fue eliminada en Neon")
    console.log("")
    console.log("Intenta de nuevo en unos segundos con: npm run db:wake")
    process.exit(1)
  }
}

wakeNeon()
