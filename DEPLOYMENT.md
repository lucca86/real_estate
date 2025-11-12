# Guía de Despliegue en Producción

Esta guía te ayudará a desplegar tu aplicación de gestión inmobiliaria en Vercel con Neon PostgreSQL.

## Requisitos Previos

- ✅ Cuenta de Vercel con proyecto conectado a GitHub
- ✅ Base de datos Neon PostgreSQL conectada
- ✅ Sitio WordPress configurado con el plugin Estatik REST API Bridge

## Paso 1: Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables** y agrega las siguientes:

### Base de Datos (Neon)

Estas variables se configuran automáticamente cuando conectas Neon, pero verifica que existan:

\`\`\`
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host.neon.tech/dbname?sslmode=require
\`\`\`

**Importante**: `DATABASE_URL` debe usar connection pooling, mientras que `DATABASE_URL_UNPOOLED` es para migraciones.

### Autenticación

\`\`\`
JWT_SECRET=tu-clave-secreta-super-segura-minimo-32-caracteres
\`\`\`

**Generar JWT_SECRET seguro:**
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

### WordPress Integration (Opcional)

Si usas sincronización con WordPress:

\`\`\`
WORDPRESS_API_URL=https://tusitio.com/wp-json
WORDPRESS_USERNAME=tu-usuario-wordpress
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
\`\`\`

## Paso 2: Ejecutar Migraciones en Producción

### Opción A: Desde tu computadora local

1. Configura la variable de entorno temporalmente:

\`\`\`bash
export DATABASE_URL="tu-url-de-neon-unpooled"
\`\`\`

2. Ejecuta las migraciones:

\`\`\`bash
npx prisma migrate deploy
\`\`\`

3. Genera el cliente de Prisma:

\`\`\`bash
npx prisma generate
\`\`\`

### Opción B: Desde Vercel CLI

1. Instala Vercel CLI:

\`\`\`bash
npm i -g vercel
\`\`\`

2. Vincula tu proyecto:

\`\`\`bash
vercel link
\`\`\`

3. Ejecuta las migraciones:

\`\`\`bash
vercel env pull .env.production
npx prisma migrate deploy --schema=./prisma/schema.prisma
\`\`\`

## Paso 3: Seed de Datos Iniciales (Primera vez)

Después de las migraciones, necesitas crear los datos iniciales:

### Crear Usuario Administrador

1. Ve a la consola SQL de Neon
2. Ejecuta el siguiente SQL:

\`\`\`sql
-- Crear usuario administrador (password: admin123)
INSERT INTO "User" (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@example.com',
  'Administrador',
  '$2a$10$rK5YqV.9H4YP3hh4qO8wWOQYZc8zqzZxqrLKQxLQxLQxLQxLQxLQ',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
\`\`\`

**Importante**: Cambia el email y la contraseña después del primer login.

### Seed de Tipos de Propiedad

\`\`\`sql
INSERT INTO "PropertyType" (id, name, description, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'Casa', 'Casa unifamiliar', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Departamento', 'Apartamento o departamento', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Terreno', 'Lote o terreno', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Local Comercial', 'Local para negocio', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Oficina', 'Oficina comercial', true, NOW(), NOW());
\`\`\`

### Seed de Ubicaciones (Argentina como ejemplo)

\`\`\`sql
-- País
INSERT INTO "Country" (id, name, code, "isActive", "createdAt", "updatedAt")
VALUES ('country-ar', 'Argentina', 'AR', true, NOW(), NOW());

-- Provincia
INSERT INTO "Province" (id, name, "countryId", "isActive", "createdAt", "updatedAt")
VALUES ('province-corrientes', 'Corrientes', 'country-ar', true, NOW(), NOW());

-- Ciudad
INSERT INTO "City" (id, name, "provinceId", "isActive", "createdAt", "updatedAt")
VALUES ('city-corrientes', 'Corrientes Capital', 'province-corrientes', true, NOW(), NOW());

-- Barrio
INSERT INTO "Neighborhood" (id, name, "cityId", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::text, 'Centro', 'city-corrientes', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'San Lorenzo', 'city-corrientes', true, NOW(), NOW());
\`\`\`

## Paso 4: Verificar Despliegue

1. **Push a GitHub**: Cada push a `main` activa un deploy automático
2. **Verifica el build**: Ve a tu proyecto en Vercel y revisa que el build sea exitoso
3. **Prueba la aplicación**: Abre tu URL de producción
4. **Login de prueba**: Usa las credenciales del administrador que creaste

## Paso 5: Post-Despliegue

### Cambiar Credenciales por Defecto

1. Inicia sesión con el usuario administrador
2. Ve a **Perfil** → **Cambiar Contraseña**
3. Actualiza tu contraseña

### Verificar Conexión con WordPress

Si configuraste WordPress:

1. Ve a **Configuración** en el menú
2. Haz clic en **"Probar Conexión"**
3. Si hay error, revisa las variables de entorno

### Configurar Dominio Personalizado

1. Ve a **Settings** → **Domains** en Vercel
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

## Troubleshooting

### Error: "Can't reach database server"

- Verifica que `DATABASE_URL` tenga `?sslmode=require` al final
- Asegúrate de que la base de datos Neon esté activa
- Revisa que las credenciales sean correctas

### Error: "Prisma Client not generated"

En `package.json`, verifica que exista:
\`\`\`json
"scripts": {
  "postinstall": "prisma generate"
}
\`\`\`

Esto asegura que Prisma se genere automáticamente en cada deploy.

### Error: "JWT_SECRET is not defined"

- Ve a Vercel → Settings → Environment Variables
- Verifica que `JWT_SECRET` esté configurada
- Haz un nuevo deploy para aplicar los cambios

### Migraciones no se aplican automáticamente

Las migraciones NO se ejecutan automáticamente en cada deploy por seguridad. Debes ejecutarlas manualmente usando una de las opciones del Paso 2.

## Comandos Útiles

\`\`\`bash
# Ver logs de producción
vercel logs

# Pull de variables de entorno
vercel env pull

# Deploy manual
vercel --prod

# Ejecutar migraciones
npx prisma migrate deploy

# Ver estado de la base de datos
npx prisma studio
\`\`\`

## Seguridad en Producción

1. ✅ Cambia las credenciales por defecto
2. ✅ Usa contraseñas fuertes para JWT_SECRET
3. ✅ Habilita 2FA para usuarios administradores
4. ✅ Revisa regularmente los logs de acceso
5. ✅ Mantén WordPress actualizado con el plugin de seguridad

## Soporte

Si encuentras problemas:

1. Revisa los logs de Vercel: `vercel logs`
2. Verifica las variables de entorno
3. Asegúrate de que las migraciones estén aplicadas
4. Consulta la documentación de Neon y Vercel

---

**¡Listo!** Tu aplicación debe estar funcionando en producción. 🚀
