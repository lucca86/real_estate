# 🔧 Guía de Configuración del Entorno Local

## Problema Actual

El error `Can't reach database server at host:5432` significa que tu archivo `.env` tiene valores placeholder en lugar de la conexión real a Neon.

## Solución Rápida

### Opción 1: Usar el Asistente Interactivo (Recomendado)

```bash
npm run setup:env
```

Este comando ejecutará un asistente que te guiará paso a paso para configurar tu archivo `.env`.

### Opción 2: Configuración Manual

1. **Obtén tu URL de Neon:**
   - Ve a https://console.neon.tech
   - Selecciona tu proyecto `real_estate`
   - Haz clic en "Connection Details"
   - Copia la **Connection String** (pooled connection)
   - Debería verse así: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech:5432/database?sslmode=require`

2. **Edita tu archivo `.env` local:**

```env
# Reemplaza esto:
DATABASE_URL="postgresql://user:password@host:5432/database"

# Con tu URL real de Neon:
DATABASE_URL="postgresql://tu-usuario:tu-password@ep-xxx.us-east-2.aws.neon.tech:5432/tu-database?sslmode=require"
```

3. **Copia la URL dos veces:**

```env
DATABASE_URL="tu-url-de-neon-aqui"
DATABASE_URL_UNPOOLED="tu-url-de-neon-aqui"
```

## Después de Configurar

Una vez que tengas el `.env` configurado correctamente:

```bash
# 1. Crear las tablas en Neon
npm run db:push

# 2. Poblar con datos iniciales
npm run db:seed

# 3. Iniciar el servidor de desarrollo
npm run dev
```

## Verificar la Conexión

Para verificar que la conexión funciona:

```bash
npm run db:status
```

## Variables de Entorno Necesarias

### Mínimo para Desarrollo Local

```env
DATABASE_URL="postgresql://..."        # ✅ OBLIGATORIO
DATABASE_URL_UNPOOLED="postgresql://..." # ✅ OBLIGATORIO
JWT_SECRET="cualquier-string-seguro"   # ✅ OBLIGATORIO
```

### Opcionales (solo si usas estas funcionalidades)

```env
# WordPress (solo si sincronizas con WordPress)
WORDPRESS_API_URL="https://tu-sitio.com/wp-json"
WORDPRESS_USERNAME="tu-usuario"
WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# Stack Auth (se configuran automáticamente en v0/Vercel)
NEXT_PUBLIC_real_estate_STACK_PROJECT_ID="..."
NEXT_PUBLIC_real_estate_STACK_PUBLISHABLE_CLIENT_KEY="..."
real_estate_STACK_SECRET_SERVER_KEY="..."
```

## Notas Importantes

- ⚠️ **NUNCA** subas tu archivo `.env` a Git (ya está en `.gitignore`)
- 🔒 La URL de Neon contiene tu password - manténla segura
- 🌐 En producción (Vercel), las variables se configuran automáticamente
- 💻 En desarrollo local, necesitas el archivo `.env`

## Solución de Problemas

### Error: "Can't reach database server"
- ✅ Verifica que copiaste la URL completa de Neon
- ✅ Asegúrate de que incluya `?sslmode=require` al final
- ✅ Verifica que no haya espacios extras al inicio o final

### Error: "Authentication failed"
- ✅ Regenera la password en console.neon.tech
- ✅ Copia la nueva connection string

### Error: "Database does not exist"
- ✅ Verifica el nombre de la base de datos en la URL
- ✅ Crea la base de datos en console.neon.tech si no existe

## ¿Necesitas Ayuda?

Si sigues teniendo problemas:
1. Ejecuta `npm run env:check` para diagnosticar
2. Verifica la consola de Neon: https://console.neon.tech
3. Revisa que tu proyecto Neon esté activo y no suspendido
```

```json file="" isHidden
