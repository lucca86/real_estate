# Guía de Deployment en Vercel

## Estado Actual

✅ **Local**: Funcionando perfectamente con Neon
✅ **Base de Datos**: Todas las tablas creadas en Neon
✅ **Usuario Admin**: Creado y funcionando
❌ **Vercel**: Falta configurar variables de entorno

## Problema en Producción

El error en Vercel es:
```
Can't reach database server at `localhost:5432`
```

Esto significa que las variables de entorno de Neon NO están configuradas en Vercel.

## Solución: Configurar Variables de Entorno en Vercel

### Paso 1: Obtener la URL de Neon

Las variables de entorno con prefijo `real_estate_` solo existen en v0, NO en Vercel. Necesitas configurarlas manualmente.

#### Opción A: Desde tu archivo `.env` local

Tu archivo `.env` local ya tiene la URL correcta. Cópiala:

```env
DATABASE_URL=postgresql://...tu URL de Neon...
```

#### Opción B: Desde Neon Console

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Ve a "Connection Details"
4. Copia la "Connection string"

### Paso 2: Configurar en Vercel

1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

#### Variables Requeridas:

```
DATABASE_URL
Valor: postgresql://[usuario]:[password]@[host]/[database]?sslmode=require

DATABASE_URL_UNPOOLED
Valor: postgresql://[usuario]:[password]@[host]/[database]?sslmode=require

JWT_SECRET
Valor: tu_secreto_jwt_seguro (mínimo 32 caracteres)

WORDPRESS_API_URL
Valor: https://tu-sitio-wordpress.com/wp-json

WORDPRESS_USERNAME
Valor: tu_usuario_wordpress

WORDPRESS_APP_PASSWORD
Valor: tu_password_de_aplicacion_wordpress
```

#### Importante sobre DATABASE_URL:

- Asegúrate de agregar `?sslmode=require` al final de la URL
- La URL debe ser la versión **pooled** de Neon
- Formato completo: `postgresql://usuario:password@host.neon.tech/dbname?sslmode=require`

### Paso 3: Verificar las Variables

Después de agregar las variables:

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Verifica que todas las variables estén configuradas
3. Asegúrate de que estén disponibles para **Production**, **Preview** y **Development**

### Paso 4: Redeployar

1. Ve a **Deployments**
2. Haz clic en los tres puntos del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz `git push` para un nuevo deployment automático

## Verificación

Después del deployment, verifica que funcione:

1. Ve a tu URL de producción: `https://tu-proyecto.vercel.app/login`
2. Intenta hacer login con:
   - Email: `admin@mahler.com`
   - Password: `Admin123!`

3. Revisa los logs en Vercel:
   - Ve a tu proyecto en Vercel
   - Click en el deployment más reciente
   - Click en **Runtime Logs**
   - Busca mensajes `[v0]` para ver el estado de la conexión

## Solución de Problemas

### Error: "Can't reach database server"

**Causa**: DATABASE_URL no está configurada o es incorrecta

**Solución**:
1. Verifica que DATABASE_URL esté en las variables de entorno de Vercel
2. Asegúrate de que tenga `?sslmode=require` al final
3. Verifica que el usuario y password sean correctos

### Error: "Invalid password"

**Causa**: La contraseña del admin no coincide

**Solución**:
```bash
# En tu máquina local:
npm run admin:reset
# Ingresa la nueva contraseña cuando te lo pida
```

### Error: "JWT_SECRET not configured"

**Causa**: JWT_SECRET no está configurado en Vercel

**Solución**:
1. Ve a Vercel → Settings → Environment Variables
2. Agrega `JWT_SECRET` con un valor seguro de al menos 32 caracteres
3. Redeploy

## Comandos Útiles

### Verificar conexión local:
```bash
npm run check:env
```

### Resetear contraseña del admin:
```bash
npm run admin:reset
```

### Verificar credenciales del admin:
```bash
npm run admin:verify
```

### Ver estado de la base de datos:
```bash
npm run db:status
```

## URLs Importantes

- **Neon Console**: https://console.neon.tech
- **Vercel Dashboard**: https://vercel.com
- **Tu Proyecto en Vercel**: https://vercel.com/[tu-usuario]/[tu-proyecto]
- **Logs de Producción**: https://vercel.com/[tu-usuario]/[tu-proyecto]/logs

## Siguiente Paso

Una vez configurado en Vercel, tu aplicación debería funcionar igual que en local:

1. ✅ Login con admin@mahler.com
2. ✅ Dashboard con estadísticas
3. ✅ Gestión de propiedades
4. ✅ Sincronización con WordPress

Si sigues teniendo problemas, revisa los logs de Vercel y comparte el mensaje de error específico.
