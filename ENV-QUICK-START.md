# 🚀 Guía Rápida: Configuración de Variables de Entorno

Esta guía te ayudará a configurar correctamente las variables de entorno para tu proyecto en 5 minutos.

## ⚡ Método Rápido (Recomendado)

### Paso 1: Verifica tu configuración actual

\`\`\`bash
npm run check:env
\`\`\`

Este comando te dirá exactamente qué variables faltan o tienen valores incorrectos.

### Paso 2: Obtén tu URL de Neon

1. Ve a [Neon Console](https://console.neon.tech)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto `real_estate`
4. Haz clic en "Connection Details"
5. Copia la **Connection string** completa (debe verse algo así):
   \`\`\`
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   \`\`\`

### Paso 3: Configura tu archivo .env

Abre el archivo `.env` en la raíz de tu proyecto y reemplaza la línea de `DATABASE_URL`:

\`\`\`env
# Reemplaza esta línea con tu URL real de Neon
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# También actualiza esta
DATABASE_URL_UNPOOLED="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# El resto de las variables pueden quedar como están por ahora
JWT_SECRET="dev-secret-key-change-in-production-98765"
\`\`\`

### Paso 4: Verifica nuevamente

\`\`\`bash
npm run check:env
\`\`\`

Deberías ver ✅ en DATABASE_URL.

### Paso 5: Inicializa la base de datos

\`\`\`bash
# Crear las tablas
npm run db:push

# Poblar con datos iniciales
npm run db:seed

# Crear usuario administrador
npm run admin:quick
\`\`\`

### Paso 6: Verifica el login

\`\`\`bash
npm run admin:verify
\`\`\`

Si todo está correcto, deberías ver:
\`\`\`
✅ ¡CONTRASEÑA VÁLIDA! Las credenciales funcionan correctamente

📋 Credenciales de prueba:
   Email: admin@mahler.com
   Contraseña: Admin123!
\`\`\`

---

## 🔧 Comandos Útiles

\`\`\`bash
# Verificar estado de variables de entorno
npm run check:env

# Verificar credenciales de administrador
npm run admin:verify

# Resetear contraseña de administrador
npm run admin:reset

# Ver estado de la base de datos
npm run db:status

# Abrir Prisma Studio (GUI para ver/editar datos)
npm run db:studio
\`\`\`

---

## ❌ Solución de Problemas

### Error: "Can't reach database server at `host:5432`"

Tu `.env` tiene valores placeholder. Sigue los pasos anteriores para obtener la URL real de Neon.

### Error: "DATABASE_URL no está configurada"

1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que tiene la línea `DATABASE_URL="..."`
3. Reinicia tu terminal/editor después de cambiar `.env`

### Error: "Invalid password"

El usuario administrador no existe o la contraseña es incorrecta. Ejecuta:
\`\`\`bash
npm run admin:reset
\`\`\`

### No puedo conectarme a Neon

1. Verifica que tu URL incluye `?sslmode=require` al final
2. Verifica que copiaste la URL completa desde Neon Console
3. Verifica que tu proyecto Neon está activo (no en modo hibernación)

---

## 🌐 Configuración para Producción (Vercel)

Después de configurar tu entorno local, también necesitas configurar Vercel:

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las mismas variables:
   - `DATABASE_URL` = tu URL de Neon
   - `DATABASE_URL_UNPOOLED` = tu URL de Neon
   - `JWT_SECRET` = un valor aleatorio seguro (puedes generarlo con `openssl rand -base64 32`)
4. Redeploy tu aplicación

Más detalles en: [VERCEL-ENV-SETUP.md](./VERCEL-ENV-SETUP.md)
