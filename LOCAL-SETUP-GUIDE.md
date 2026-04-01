# Guía de Configuración Local con Neon

## Paso 1: Obtener las credenciales de Neon

### Opción A: Desde la Consola de Neon (Recomendado)

1. Ve a [Neon Console](https://console.neon.tech)
2. Selecciona tu proyecto
3. Ve a la sección **Connection Details**
4. Copia la **Connection String** (debería verse así):
   \`\`\`
   postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   \`\`\`

### Opción B: Desde Vercel (si ya está desplegado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Busca las variables que empiezan con `real_estate_`
4. Copia el valor de `real_estate_DATABASE_URL`

## Paso 2: Configurar el archivo .env local

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza la línea `DATABASE_URL=` con tu URL real de Neon:
   \`\`\`env
   DATABASE_URL="postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require"
   \`\`\`

## Paso 3: Instalar dependencias

\`\`\`bash
npm install
\`\`\`

## Paso 4: Verificar la configuración

\`\`\`bash
npm run env:check
\`\`\`

Este comando verificará que todas las variables de entorno necesarias estén configuradas correctamente.

## Paso 5: Inicializar la base de datos

### Opción A: Usar Prisma Push (Recomendado para desarrollo)

\`\`\`bash
npm run db:push
\`\`\`

Este comando:
- Crea todas las tablas según tu schema de Prisma
- No requiere crear migraciones
- Es más rápido para desarrollo

### Opción B: Usar Migraciones (Para producción)

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

Este comando:
- Crea una migración inicial
- Aplica la migración a la base de datos
- Genera el cliente de Prisma

## Paso 6: Poblar la base de datos con datos iniciales

\`\`\`bash
npm run db:seed
\`\`\`

Este comando crea:
- Un usuario administrador (admin@example.com / admin123)
- Tipos de propiedades (Casa, Departamento, Terreno, etc.)
- Datos de ubicación (Argentina y sus provincias)
- Propiedades de ejemplo

## Paso 7: Verificar que todo funciona

\`\`\`bash
npm run db:status
\`\`\`

Este comando muestra:
- Estado de la conexión a Neon
- Tablas creadas
- Cantidad de registros en cada tabla

## Paso 8: Iniciar el servidor de desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Comandos Útiles

- `npm run db:studio` - Abre Prisma Studio para ver/editar datos
- `npm run db:reset` - Elimina todas las tablas y datos (usa con cuidado)
- `npm run db:push` - Sincroniza el schema con la base de datos
- `npm run db:seed` - Vuelve a poblar la base de datos con datos iniciales

## Solución de Problemas

### Error: "No database connection string"

**Problema:** La variable `DATABASE_URL` no está configurada correctamente.

**Solución:**
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que `DATABASE_URL` tiene una URL válida de Neon
3. Asegúrate de que la URL incluye `?sslmode=require` al final

### Error: "datasource not defined"

**Problema:** Prisma no puede leer el schema.

**Solución:**
\`\`\`bash
npx prisma generate
\`\`\`

### Error: "Table does not exist"

**Problema:** La base de datos no tiene las tablas necesarias.

**Solución:**
\`\`\`bash
npm run db:push
npm run db:seed
\`\`\`

### Las tablas existen pero no hay datos

**Solución:**
\`\`\`bash
npm run db:seed
\`\`\`

## Credenciales de Prueba

Después de ejecutar `npm run db:seed`, puedes usar:

- **Email:** admin@example.com
- **Password:** admin123
- **Rol:** ADMIN

## Estructura de la Base de Datos

Tu base de datos tendrá estas tablas:

- `User` - Usuarios del sistema
- `Session` - Sesiones activas
- `Property` - Propiedades inmobiliarias
- `PropertyType` - Tipos de propiedad
- `Owner` - Propietarios
- `Client` - Clientes
- `Appointment` - Citas
- `Country` - Países
- `Province` - Provincias
- `City` - Ciudades
- `Neighborhood` - Barrios

## Siguiente Paso

Una vez que todo esté funcionando localmente, puedes:

1. Hacer commits de tus cambios a GitHub
2. Vercel detectará automáticamente los cambios
3. Se desplegará automáticamente en producción
4. La misma base de datos Neon se usará en producción

¡Tu entorno de desarrollo local ahora está sincronizado con producción! 🎉
