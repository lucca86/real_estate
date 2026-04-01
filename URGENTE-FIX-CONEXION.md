# 🚨 CORRECCIÓN URGENTE - Problema de Conexión Neon

## El Problema

Tu archivo `.env` local tiene este parámetro problemático:
\`\`\`
channel_binding=require
\`\`\`

Este parámetro causa que Prisma no pueda conectarse a Neon, generando el error:
\`\`\`
Can't reach database server at `ep-spring-hat-ad436c6g-pooler.c-2.us-east-1.aws.neon.tech:5432`
\`\`\`

## ✅ SOLUCIÓN INMEDIATA

### Paso 1: Abre tu archivo `.env` local

Busca la línea que dice:
\`\`\`env
DATABASE_URL="postgresql://neondb_owner:npg_hqjs3Llti4eY@ep-spring-hat-ad436c6g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
\`\`\`

### Paso 2: ELIMINA `&channel_binding=require`

Cambia la URL a:
\`\`\`env
DATABASE_URL="postgresql://neondb_owner:npg_hqjs3Llti4eY@ep-spring-hat-ad436c6g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
\`\`\`

### Paso 3: Haz lo mismo con DATABASE_URL_UNPOOLED

Si tienes esta variable, también elimina `&channel_binding=require`:
\`\`\`env
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_hqjs3Llti4eY@ep-spring-hat-ad436c6g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
\`\`\`

### Paso 4: Guarda el archivo

### Paso 5: Reinicia el servidor

\`\`\`bash
# Detén el servidor (Ctrl+C)
# Luego ejecuta:
npm run dev
\`\`\`

## Verificación

Después de reiniciar, deberías ver en la consola:
\`\`\`
[v0] Removed channel_binding parameter from database URL
[v0] Database URL configured for Neon with optimized parameters
\`\`\`

Y NO deberías ver más:
\`\`\`
prisma:error Can't reach database server
\`\`\`

## Tu archivo .env correcto debería verse así:

\`\`\`env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_hqjs3Llti4eY@ep-spring-hat-ad436c6g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_hqjs3Llti4eY@ep-spring-hat-ad436c6g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT Secret
JWT_SECRET="deloquehaynofaltanada"

# WordPress API
WORDPRESS_API_URL="https://nuevo.mahlerpropiedades.com.ar/wp-json"
WORDPRESS_USERNAME="redestrategia"
WORDPRESS_APP_PASSWORD="81ad 1cc4 43UF nSKe kRyJ xtcB"
WORDPRESS_API_KEY="81ad 1cc4 43UF nSKe kRyJ xtcB"
\`\`\`

## ¿Por qué ocurre esto?

Neon recomienda usar `channel_binding=require` para mayor seguridad, pero Prisma Client en modo desarrollo tiene problemas con este parámetro. El código en `lib/db.ts` ahora lo elimina automáticamente, pero debes actualizar tu archivo `.env` local primero.

## Si el problema persiste

1. **Verifica que la URL sea correcta**: Copia la URL directamente desde la consola de Neon
2. **Ejecuta prisma generate**: `npx prisma generate`
3. **Limpia el cache**: Elimina la carpeta `.next` y reinicia
4. **Revisa los logs**: Busca mensajes de `[v0]` en la consola del servidor

## Contacto de Soporte

Si después de estos pasos el problema persiste, revisa:
- Que tu base de datos Neon esté activa en console.neon.tech
- Que no haya límites de conexión alcanzados en tu plan de Neon
- Los logs completos del servidor para errores adicionales
