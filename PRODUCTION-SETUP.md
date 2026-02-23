# Configuración de Producción en Vercel

## Variables de Entorno Requeridas

Para que el login funcione correctamente en producción, asegúrate de configurar las siguientes variables de entorno en Vercel:

### 1. Base de Datos (Neon)

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

\`\`\`
DATABASE_URL = postgresql://[user]:[password]@[host]/[database]?sslmode=require
\`\`\`

O si ya tienes la integración de Neon:
\`\`\`
DATABASE_URL = ${real_estate_DATABASE_URL}
\`\`\`

### 2. JWT Secret

**IMPORTANTE**: Genera un secret seguro para JWT:

\`\`\`bash
# Generar un secret aleatorio
openssl rand -base64 32
\`\`\`

Agrega en Vercel:
\`\`\`
JWT_SECRET = [tu-secret-generado-aqui]
\`\`\`

### 3. WordPress (si aplica)

\`\`\`
WORDPRESS_API_URL = https://tu-sitio-wordpress.com
WORDPRESS_USERNAME = tu-usuario
WORDPRESS_APP_PASSWORD = tu-password-de-aplicacion
\`\`\`

## Verificar Configuración

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Verifica que `DATABASE_URL` y `JWT_SECRET` estén configurados
4. Re-deploy tu aplicación para que tome las nuevas variables

## Solución de Problemas

### Error 500 en Login

1. **Verifica DATABASE_URL**: 
   - Ve a Vercel → Settings → Environment Variables
   - Confirma que `DATABASE_URL` apunte a tu base de datos Neon

2. **Verifica JWT_SECRET**:
   - Debe estar configurado en Vercel
   - No debe ser el valor por defecto

3. **Verifica los Logs**:
   - Vercel Dashboard → Deployments → [tu deployment] → Functions
   - Busca logs con `[v0]` para ver errores específicos

4. **Verifica que Prisma esté generado**:
   - El build de Vercel debe ejecutar `prisma generate`
   - Verifica en Build Logs que no haya errores de Prisma

### Error de Conexión a Base de Datos

Si ves errores de conexión:

1. Ve a Neon Dashboard
2. Verifica que tu base de datos esté activa
3. Copia la connection string desde Neon
4. Actualiza `DATABASE_URL` en Vercel
5. Re-deploy

### Usuario Administrador

Si no puedes hacer login porque no hay usuarios:

1. Conéctate a tu base de datos Neon con un cliente SQL
2. Ejecuta el script de creación de usuario admin:

\`\`\`sql
INSERT INTO "User" (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Administrador',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLvzw/jO', -- password: admin123
  'ADMIN',
  true,
  NOW(),
  NOW()
);
\`\`\`

O usa el script desde tu local conectado a Neon:
\`\`\`bash
npm run admin:quick
\`\`\`

## Checklist de Producción

- [ ] `DATABASE_URL` configurado en Vercel
- [ ] `JWT_SECRET` configurado (valor seguro, no default)
- [ ] Prisma Client generado durante el build
- [ ] Base de datos Neon activa y accesible
- [ ] Usuario administrador creado
- [ ] Variables de WordPress configuradas (si aplica)
- [ ] Build exitoso sin errores
- [ ] Logs de producción revisados
