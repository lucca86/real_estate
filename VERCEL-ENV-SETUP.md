# Configuración de Variables de Entorno en Vercel

## Problema Actual

El deploy en Vercel está fallando con el error:
\`\`\`
Can't reach database server at `localhost:5432`
\`\`\`

Esto significa que las variables de entorno de Neon NO están configuradas en Vercel.

## Solución

### Opción 1: Usar las Variables Existentes de v0 (RECOMENDADO)

Las siguientes variables ya existen en el entorno de v0 y están disponibles automáticamente:

\`\`\`env
real_estate_DATABASE_URL=postgresql://...
real_estate_POSTGRES_URL=postgresql://...
real_estate_POSTGRES_PRISMA_URL=postgresql://...
real_estate_DATABASE_URL_UNPOOLED=postgresql://...
\`\`\`

**IMPORTANTE:** Estas variables solo funcionan en v0. En Vercel, necesitas configurarlas manualmente.

### Paso 1: Obtener la URL de Neon

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Selecciona tu proyecto
3. Ve a la pestaña "Connection Details"
4. Copia la **Connection String** (la URL completa de PostgreSQL)
   
   Ejemplo: `postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb`

### Paso 2: Configurar en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto "real-estate-management"
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

#### Variables Requeridas:

\`\`\`env
DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
\`\`\`

**IMPORTANTE:** 
- Asegúrate de agregar `?sslmode=require` al final de la URL
- Esta es la variable principal que usa Prisma

#### Variables Opcionales (para compatibilidad):

\`\`\`env
POSTGRES_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
real_estate_DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
\`\`\`

#### Otras Variables Necesarias:

\`\`\`env
JWT_SECRET=tu-secreto-jwt-seguro-aqui
WORDPRESS_API_URL=https://tu-wordpress.com/wp-json
WORDPRESS_USERNAME=tu-usuario
WORDPRESS_APP_PASSWORD=tu-app-password
\`\`\`

### Paso 3: Redeploy

1. Ve a la pestaña **Deployments**
2. Haz clic en los **tres puntos** del último deployment
3. Selecciona **Redeploy**
4. Marca la opción **Use existing Build Cache**
5. Haz clic en **Redeploy**

### Paso 4: Verificar

Después del deploy, revisa los logs:

1. Ve a **Deployments**
2. Haz clic en el último deployment
3. Ve a la pestaña **Build Logs**
4. Busca el mensaje: `[v0] Database connected successfully in production`

Si ves este mensaje, la conexión fue exitosa. Si no, revisa que la URL de Neon sea correcta.

---

## Solución de Problemas

### Error: "Can't reach database server at localhost:5432"

**Causa:** La variable `DATABASE_URL` no está configurada en Vercel.

**Solución:** Sigue los pasos anteriores para configurar `DATABASE_URL`.

### Error: "P1001: Can't reach database server"

**Causas posibles:**
1. La URL de Neon es incorrecta
2. Falta agregar `?sslmode=require` al final de la URL
3. El proyecto de Neon está pausado o eliminado

**Solución:**
1. Verifica que la URL de Neon sea correcta
2. Asegúrate de que tu proyecto de Neon esté activo
3. Agrega `?sslmode=require` al final de la URL

### Error: "Connection timed out"

**Causa:** Problema de red o el proyecto de Neon está pausado.

**Solución:**
1. Ve a console.neon.tech y verifica que tu proyecto esté activo
2. Si está pausado, actívalo
3. Espera unos minutos y vuelve a deployar

---

## Verificación Local vs Producción

### Local (.env)
\`\`\`env
DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
\`\`\`

### Producción (Vercel)
Las mismas variables deben estar configuradas en Vercel Dashboard → Settings → Environment Variables

**IMPORTANTE:** Los archivos `.env` locales NO se suben a GitHub ni a Vercel por seguridad. Debes configurar las variables manualmente en Vercel.

---

## Comandos Útiles

### Verificar conexión local
\`\`\`bash
npm run db:status
\`\`\`

### Ver tablas en Neon
\`\`\`bash
npx prisma studio
\`\`\`

### Aplicar cambios al schema
\`\`\`bash
npm run db:push
\`\`\`

### Ver logs de producción
\`\`\`bash
vercel logs
\`\`\`

---

## Recursos

- [Documentación de Neon](https://neon.tech/docs)
- [Variables de Entorno en Vercel](https://vercel.com/docs/projects/environment-variables)
- [Prisma con Neon](https://www.prisma.io/docs/guides/database/neon)
