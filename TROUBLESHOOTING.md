# 🔧 Guía de Solución de Problemas

Esta guía te ayudará a resolver los problemas más comunes en el proyecto.

## 🔐 Problemas de Autenticación

### Error: "Credenciales inválidas" en producción

**Síntomas:**
- El login funciona en desarrollo pero falla en producción
- Los logs muestran "Invalid password"
- La base de datos se conecta correctamente

**Causa:**
La contraseña del usuario administrador no coincide o está mal hasheada.

**Solución:**

1. **Verificar las credenciales actuales:**
   \`\`\`bash
   npm run admin:verify
   \`\`\`

2. **Si la contraseña es inválida, resetearla:**
   \`\`\`bash
   npm run admin:reset
   \`\`\`

3. **O crear un nuevo administrador:**
   \`\`\`bash
   npm run admin:create
   \`\`\`

**Credenciales por defecto:**
- Email: `admin@mahler.com`
- Contraseña: `Admin123!`

---

## 🗄️ Problemas de Base de Datos

### Error: "Can't reach database server at localhost:5432"

**Síntomas:**
- Error 500 en producción
- Los logs muestran `localhost:5432`
- No se puede conectar a la base de datos

**Causa:**
La variable `DATABASE_URL` no está configurada en Vercel.

**Solución:**

1. **Obtén tu URL de Neon:**
   - Ve a [console.neon.tech](https://console.neon.tech)
   - Selecciona tu proyecto
   - Ve a Dashboard → Connection String
   - Copia la URL que empieza con `postgresql://`

2. **Configura en Vercel:**
   - Ve a tu proyecto en [vercel.com](https://vercel.com)
   - Settings → Environment Variables
   - Agrega: `DATABASE_URL` = tu URL de Neon
   - Guarda y redeploy

3. **Verifica la conexión:**
   \`\`\`bash
   npm run db:status
   \`\`\`

**Referencia:** Ver [VERCEL-ENV-SETUP.md](./VERCEL-ENV-SETUP.md) para instrucciones detalladas.

---

### Error: "You don't have any datasource defined"

**Síntomas:**
- `npx prisma generate` falla
- Error: "No datasource defined in schema.prisma"

**Causa:**
El archivo `prisma/schema.prisma` está desactualizado o corrupto.

**Solución:**

1. **Hacer git pull:**
   \`\`\`bash
   git pull origin main
   \`\`\`

2. **Verificar el datasource:**
   Abre `prisma/schema.prisma` y verifica que tenga:
   \`\`\`prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DATABASE_URL_UNPOOLED")
   }
   \`\`\`

3. **Regenerar Prisma Client:**
   \`\`\`bash
   npm run prisma:generate
   \`\`\`

---

## 🌐 Problemas de Deployment en Vercel

### Build falla con error de Prisma

**Síntomas:**
- El build en Vercel falla
- Error relacionado con Prisma Client

**Solución:**

1. **Verifica que `postinstall` esté configurado:**
   En `package.json` debe existir:
   \`\`\`json
   "scripts": {
     "postinstall": "prisma generate"
   }
   \`\`\`

2. **Verifica las variables de entorno:**
   - `DATABASE_URL` debe estar configurada
   - `JWT_SECRET` debe estar configurada

3. **Force redeploy:**
   \`\`\`bash
   git commit --allow-empty -m "Force rebuild"
   git push
   \`\`\`

---

### Error 500 después del deployment

**Síntomas:**
- El sitio deployó correctamente
- Pero todas las páginas dan error 500

**Solución:**

1. **Revisa los logs de Vercel:**
   - Ve a tu proyecto en Vercel
   - Click en el deployment
   - Ve a "Runtime Logs"

2. **Problemas comunes:**
   - **Database connection:** Verifica `DATABASE_URL`
   - **JWT issues:** Verifica `JWT_SECRET`
   - **Missing env vars:** Revisa que todas las variables estén configuradas

3. **Ejecuta las migraciones:**
   \`\`\`bash
   npm run db:push
   \`\`\`

---

## 📝 Variables de Entorno

### Lista de variables requeridas

**En desarrollo (.env):**
\`\`\`env
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."
JWT_SECRET="tu-secreto-seguro-aqui"
WORDPRESS_API_URL="https://tu-wordpress.com"
WORDPRESS_USERNAME="tu-usuario"
WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx"
\`\`\`

**En producción (Vercel):**
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` (opcional)
- `JWT_SECRET`
- `WORDPRESS_API_URL`
- `WORDPRESS_USERNAME`
- `WORDPRESS_APP_PASSWORD`

**Verificar configuración:**
\`\`\`bash
npm run env:check
\`\`\`

---

## 🔄 WordPress Sync Issues

### Las propiedades no se sincronizan

**Síntomas:**
- Las propiedades se crean en Next.js pero no aparecen en WordPress
- O viceversa

**Solución:**

1. **Verifica el plugin de WordPress:**
   - Debe estar instalado: `estatik-rest-api-bridge`
   - Debe estar activado
   - Ubicación: `wordpress-setup/estatik-rest-api-bridge/`

2. **Verifica las credenciales de WordPress:**
   - `WORDPRESS_API_URL` debe terminar en `/wp-json`
   - `WORDPRESS_APP_PASSWORD` debe ser una contraseña de aplicación válida

3. **Revisa los logs:**
   - En Next.js: Busca `[v0]` en los logs
   - En WordPress: Busca errores en el log de errores de PHP

**Referencia:** Ver documentación de WordPress sync para más detalles.

---

## 🆘 Comandos Útiles de Diagnóstico

\`\`\`bash
# Verificar estado de la base de datos
npm run db:status

# Verificar variables de entorno
npm run env:check

# Verificar credenciales de admin
npm run admin:verify

# Ver estructura de la base de datos
npm run db:studio

# Regenerar Prisma Client
npm run prisma:generate
\`\`\`

---

## 📞 Soporte Adicional

Si ninguna de estas soluciones funciona:

1. **Revisa los logs detallados:**
   - Vercel Runtime Logs
   - Next.js console output
   - WordPress error logs

2. **Consulta la documentación:**
   - [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md)
   - [VERCEL-ENV-SETUP.md](./VERCEL-ENV-SETUP.md)
   - [ADMIN-SETUP.md](./ADMIN-SETUP.md)

3. **Comandos de reset (último recurso):**
   \`\`\`bash
   # Reset de base de datos
   npm run db:reset
   
   # Reinicializar todo
   npm run db:init
   npm run admin:quick
