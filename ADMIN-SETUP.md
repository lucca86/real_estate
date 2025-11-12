# Configuración de Usuario Administrador

Esta guía te ayudará a crear el usuario administrador inicial para tu aplicación de gestión inmobiliaria.

## Requisitos Previos

Antes de crear el usuario administrador, asegúrate de:

1. ✅ Tener configurado el archivo `.env` con `DATABASE_URL`
2. ✅ Haber ejecutado las migraciones de la base de datos (`npm run db:push`)
3. ✅ Verificar la conexión a Neon (`npm run db:status`)

## Opción 1: Crear Administrador con Credenciales Personalizadas (Recomendado)

Este método te permite ingresar tus propias credenciales de forma interactiva:

\`\`\`bash
npm run admin:create
\`\`\`

El script te pedirá:
- **Email**: Email del administrador (ej: admin@mahler.com)
- **Nombre**: Nombre completo (ej: Juan Pérez)
- **Contraseña**: Contraseña segura (ej: MiPassword123!)
- **Teléfono**: Número de contacto (ej: +54 9 379 1234567)

### Ejemplo de Ejecución:

\`\`\`
🔐 Creando Usuario Administrador

Email del administrador (admin@mahler.com): admin@mahler.com
Nombre del administrador (Administrador): Juan Pérez
Contraseña (Admin123!): MiPasswordSegura123!
Teléfono (+54 9 379 1234567): +54 9 379 4556789

🔒 Hasheando contraseña...
💾 Creando usuario en la base de datos...

✅ Usuario administrador creado exitosamente!

📋 Credenciales:
   Email: admin@mahler.com
   Contraseña: MiPasswordSegura123!
   Rol: ADMIN

⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro
   y cambia la contraseña después del primer inicio de sesión.
\`\`\`

## Opción 2: Crear Administrador con Credenciales por Defecto (Rápido)

Este método crea un administrador con credenciales predefinidas:

\`\`\`bash
npm run admin:quick
\`\`\`

**Credenciales por Defecto:**
- Email: `admin@mahler.com`
- Contraseña: `Admin123!`
- Nombre: `Administrador`
- Teléfono: `+54 9 379 1234567`
- Rol: `ADMIN`

⚠️ **IMPORTANTE**: Después de iniciar sesión por primera vez, cambia inmediatamente la contraseña desde la configuración de tu perfil.

## Opción 3: Ejecutar Script SQL Manualmente

Si prefieres ejecutar SQL directamente en Neon:

1. Abre la consola SQL de Neon en https://console.neon.tech
2. Selecciona tu proyecto y base de datos
3. Genera el hash de tu contraseña:

\`\`\`bash
# En Node.js o en tu terminal con Node instalado
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('TuContraseña', 10))"
\`\`\`

4. Ejecuta el siguiente SQL (reemplaza los valores):

\`\`\`sql
INSERT INTO "User" (
  id,
  email,
  name,
  password,
  role,
  phone,
  "twoFactorEnabled",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin_' || substr(md5(random()::text), 1, 20),
  'admin@mahler.com',
  'Administrador',
  '$2a$10$TU_HASH_AQUI', -- Reemplaza con el hash generado
  'ADMIN',
  '+54 9 379 1234567',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  password = EXCLUDED.password,
  role = 'ADMIN',
  "isActive" = true,
  "updatedAt" = NOW();
\`\`\`

## Verificar el Usuario Creado

Después de crear el usuario, verifica que se haya creado correctamente:

\`\`\`bash
npm run db:status
\`\`\`

O inicia sesión en la aplicación:

\`\`\`bash
npm run dev
\`\`\`

Abre http://localhost:3000/login e inicia sesión con las credenciales del administrador.

## Roles de Usuario

La aplicación tiene tres roles:

- **ADMIN**: Acceso completo a todas las funcionalidades
- **SUPERVISOR**: Puede gestionar propiedades y ver reportes
- **VENDEDOR**: Puede ver propiedades y gestionar sus propios clientes

## Solución de Problemas

### Error: "DATABASE_URL no está configurada"

Asegúrate de que tu archivo `.env` tenga la variable `DATABASE_URL` configurada:

\`\`\`env
DATABASE_URL="postgresql://usuario:password@host.neon.tech/database?sslmode=require"
\`\`\`

### Error: "Email already exists"

Si el email ya existe, el script actualizará la contraseña del usuario existente manteniendo el rol ADMIN.

### Error: "Can't reach database server"

Verifica que:
1. Tu URL de Neon sea correcta
2. Tengas conexión a internet
3. El proyecto de Neon esté activo

### ¿Olvidaste la Contraseña?

Ejecuta nuevamente cualquiera de los scripts de creación. Si el email ya existe, actualizará la contraseña.

## Seguridad

### Mejores Prácticas:

1. ✅ Cambia la contraseña por defecto inmediatamente
2. ✅ Usa contraseñas fuertes (mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos)
3. ✅ No compartas las credenciales de administrador
4. ✅ Habilita la autenticación de dos factores cuando sea posible
5. ✅ No commits el archivo `.env` a Git (ya está en .gitignore)

## Siguientes Pasos

Una vez que tengas tu usuario administrador:

1. Inicia sesión en la aplicación
2. Configura los tipos de propiedad desde el panel de administración
3. Agrega ubicaciones (países, provincias, ciudades, barrios)
4. Crea usuarios adicionales (supervisores y vendedores)
5. Configura la sincronización con WordPress
6. Comienza a agregar propiedades

## Recursos Adicionales

- [Guía de Configuración Local](./LOCAL-SETUP-GUIDE.md)
- [Documentación de Neon](./NEON-SETUP.md)
- [Variables de Entorno](./ENV-SETUP-GUIDE.md)
