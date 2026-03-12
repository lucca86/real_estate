# 🚀 Inicio Rápido - Real Estate Manager

Esta guía te ayudará a poner en marcha tu entorno de desarrollo local conectado a Neon en la nube en menos de 5 minutos.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Vercel con proyecto conectado
- Base de datos Neon conectada (ya configurada en tu proyecto)

## 🔧 Configuración en 3 Pasos

### Paso 1: Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### Paso 2: Configurar Variables de Entorno

Tu archivo `.env` ya está configurado para usar las variables de Neon que están disponibles en tu entorno. Las variables que empiezan con `real_estate_` ya están cargadas automáticamente.

**Verifica tu archivo `.env`:**

\`\`\`env
# Estas variables usan las credenciales de Neon que ya tienes
DATABASE_URL="${real_estate_DATABASE_URL}"
DATABASE_URL_UNPOOLED="${real_estate_DATABASE_URL_UNPOOLED}"

# Genera un JWT secret seguro
JWT_SECRET="tu-clave-secreta-aqui"
\`\`\`

**Si necesitas obtener las URLs directamente**, ejecuta:

\`\`\`bash
# Ver las variables de entorno disponibles
npm run env:check
\`\`\`

### Paso 3: Inicializar la Base de Datos

\`\`\`bash
# Generar el cliente de Prisma
npx prisma generate

# Crear todas las tablas en Neon
npx prisma db push

# (Opcional) Poblar con datos de ejemplo
npm run db:seed
\`\`\`

## ✅ Verificar la Instalación

\`\`\`bash
# Iniciar el servidor de desarrollo
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Comandos de Base de Datos Útiles

\`\`\`bash
# Ver el estado de la base de datos
npm run db:status

# Abrir Prisma Studio (interfaz visual)
npx prisma studio

# Crear una migración (cuando hagas cambios al schema)
npx prisma migrate dev --name nombre-descriptivo

# Ver los datos directamente en Neon
npm run db:check
\`\`\`

## 🔍 Solución de Problemas

### Error: "No database connection string"

Tu archivo `.env` no tiene las credenciales correctas. Las variables de Neon con prefijo `real_estate_` deben estar disponibles.

**Solución:**

\`\`\`bash
# Opción 1: Usar el script de setup interactivo
npm run setup:local

# Opción 2: Copiar manualmente desde Vercel
# 1. Ve a tu proyecto en Vercel Dashboard
# 2. Settings → Environment Variables
# 3. Copia las variables que empiezan con "real_estate_" o "POSTGRES"
\`\`\`

### Error: Prisma no puede conectarse

**Verifica la conexión:**

\`\`\`bash
npx prisma db pull
\`\`\`

Si falla, verifica que:
1. Las URLs de Neon están correctas en `.env`
2. Tu IP está permitida en Neon (por defecto, Neon permite todas las IPs)
3. Las credenciales son correctas

### La base de datos está vacía

Ejecuta la migración inicial:

\`\`\`bash
npx prisma db push
npm run db:seed
\`\`\`

## 📚 Recursos

- [Documentación de Neon](https://neon.tech/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Guía de Deployment](./DEPLOYMENT.md)

## 🆘 Ayuda

Si sigues teniendo problemas:

1. Revisa los logs completos con `npm run dev`
2. Verifica las variables de entorno con `npm run env:check`
3. Consulta la [documentación completa](./LOCAL-DEV-SETUP.md)
