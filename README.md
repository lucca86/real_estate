# 🏠 Sistema de Gestión Inmobiliaria

Sistema completo de gestión de negocios inmobiliarios con Next.js, TypeScript y PostgreSQL (Neon).

## 🚨 ¿Problemas de Conexión? Lee Esto Primero

Si ves errores como:
- "Can't reach database server at `ep-xxxxx.neon.tech:5432`"
- "Connection timeout"
- "Timed out fetching a new connection from the connection pool"

👉 **[LEE URGENTE-FIX-CONEXION.md](./URGENTE-FIX-CONEXION.md)** 👈

**Solución rápida:** El problema más común es el parámetro `channel_binding=require` en tu URL de Neon. Ábrelo en tu archivo `.env` y elimina `&channel_binding=require` de la URL, dejando solo `?sslmode=require`.

---

## ✨ Características

- Autenticación robusta con 2FA
- Gestión de usuarios con roles (Admin, Supervisor, Vendedor)
- CRUD completo de inmuebles
- Catálogo con búsqueda y filtros avanzados
- Dashboard con métricas
- Integración con WordPress
- Modo claro/oscuro
- Diseño responsive

## 🚀 Inicio Rápido

### Primera Configuración (Desarrollo Local)

**Opción A: Configuración Asistida (Recomendado para Primera Vez)**

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar archivo .env con tus credenciales de Neon
npm run setup:env

# 3. Inicializar base de datos
npm run db:push

# 4. Crear usuario administrador
npm run admin:quick  # Con credenciales por defecto
# o
npm run admin:create # Con credenciales personalizadas (interactivo)

# 5. Poblar con datos iniciales (opcional)
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

**Opción B: Configuración Automática (Si ya tienes Vercel configurado)**

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno local con Neon
npm run setup:local

# 3. Iniciar servidor de desarrollo
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

**📖 Para guía detallada de configuración**: Ver [ENV-SETUP-GUIDE.md](./ENV-SETUP-GUIDE.md) o [LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md)

## 🛠️ Comandos Principales

### Desarrollo
```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm start                # Iniciar servidor de producción
npm run lint             # Ejecutar linter
```

### Base de Datos
```bash
npm run db:status        # Ver estado de la base de datos
npm run db:setup         # Inicializar base de datos completa
npm run db:push          # Sincronizar schema (desarrollo)
npm run db:migrate       # Crear/aplicar migraciones
npm run db:studio        # Abrir editor visual de Prisma
npm run db:seed          # Poblar con datos de prueba
npm run db:init          # Inicializar DB con datos básicos
npm run db:reset         # Resetear base de datos (⚠️ elimina todos los datos)
```

### Administración de Usuarios
```bash
npm run admin:create     # Crear usuario administrador (interactivo)
npm run admin:quick      # Crear admin con credenciales por defecto
```

### Configuración
```bash
npm run setup:env        # Configurar .env (interactivo, recomendado)
npm run setup:local      # Configurar entorno local interactivo
npm run verify:env       # Verificar variables de entorno
npm run env:check        # Verificar configuración de entorno
```

### Datos Iniciales
```bash
npm run seed:property-types  # Seed de tipos de propiedad
npm run seed:locations       # Seed de ubicaciones (países, provincias, ciudades)
```

## Integración con WordPress

Para sincronizar propiedades con WordPress:

### 1. Configurar WordPress

1. Instala el plugin **Major Estatik** en tu sitio WordPress
2. Asegúrate de que tu usuario tenga rol de **Editor** o **Administrador**

### 2. Generar Application Password

1. Ve a **Usuarios → Perfil** en tu panel de WordPress
2. Desplázate hasta la sección **"Contraseñas de aplicación"**
3. Ingresa un nombre descriptivo (ej: "Real Estate App")
4. Haz clic en **"Añadir nueva contraseña de aplicación"**
5. Copia la contraseña generada (formato: `xxxx xxxx xxxx xxxx xxxx xxxx`)

### 3. Instalar Plugin Personalizado (REQUERIDO)


**Este paso es OBLIGATORIO para que todos los campos se sincronicen correctamente.**

El plugin personalizado "Estatik REST API Bridge" permite sincronizar todos los campos de las propiedades sin restricciones de WordPress REST API.

#### Instalación:

1. **Subir el plugin a WordPress:**
   - Copia la carpeta `wordpress-setup/estatik-rest-api-bridge/` 
   - Súbela a `wp-content/plugins/` en tu servidor WordPress
   - O comprime la carpeta en un ZIP y súbela desde **Plugins → Añadir nuevo → Subir plugin**

2. **Activar el plugin:**
   - Ve a **Plugins → Plugins instalados** en WordPress
   - Busca "Estatik REST API Bridge"
   - Haz clic en **"Activar"**

3. **Verificar instalación:**
   - El plugin expondrá el endpoint: `/wp-json/estatik-bridge/v1/properties`
   - No requiere configuración adicional

**¿Por qué es necesario?**
- WordPress REST API por defecto NO permite actualizar campos personalizados (meta fields)
- Solo el título y contenido se guardarían sin este plugin
- El plugin usa `update_post_meta()` directamente para guardar todos los campos

### 4. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
WORDPRESS_API_URL="https://tusitio.com/wp-json"
WORDPRESS_USERNAME="tu-usuario-wordpress"
WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx"
```

### 5. Probar la Conexión

1. Inicia sesión como administrador en el sistema
2. Ve a **Configuración** en el menú lateral
3. Haz clic en **"Probar Conexión"** para verificar las credenciales
4. Si la conexión es exitosa, podrás sincronizar propiedades

### Sincronización

- **Individual**: Desde la página de detalle de cada propiedad
- **Masiva**: Desde la página de Configuración (solo administradores)

### Troubleshooting

**Solo el título se guarda, los demás campos están vacíos:**
- ✅ **Verifica que el plugin "Estatik REST API Bridge" esté instalado y activado**
- Revisa los logs de la consola del navegador para ver qué se está enviando
- Asegúrate de que Major Estatik esté instalado y configurado

**Error 401 - No autorizado:**
- Verifica que el Application Password sea correcto
- Asegúrate de que el usuario tenga rol de Editor o Administrador
- Verifica que la URL de la API sea correcta (debe terminar en `/wp-json`)

**Error: Plugin no detectado:**
- Verifica que la carpeta del plugin esté en `wp-content/plugins/estatik-rest-api-bridge/`
- Asegúrate de que el plugin esté activado en WordPress
- Revisa los logs de errores de WordPress

Para más detalles, consulta:
- `wordpress-setup/estatik-rest-api-bridge/README.md` - Documentación del plugin
- `wordpress-setup/README.md` - Guía de integración completa

## 🌍 Stack Tecnológico

- **Framework**: Next.js 16
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Autenticación**: JWT con 2FA (bcryptjs, jose, otplib)
- **Integración**: WordPress REST API
- **UI**: Tailwind CSS + shadcn/ui
- **Despliegue**: Vercel

## 📦 Estructura del Proyecto

```
real-estate-management/
├── app/                    # Rutas de Next.js (App Router)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas del dashboard
│   └── (public)/          # Rutas públicas
├── components/            # Componentes React
│   └── ui/               # Componentes de UI (shadcn)
├── lib/                   # Utilidades y configuración
│   ├── actions/          # Server Actions
│   ├── auth.ts           # Autenticación
│   └── prisma.ts         # Cliente de Prisma
├── prisma/               # Schema y migraciones de Prisma
│   ├── schema.prisma     # Definición del schema
│   └── migrations/       # Migraciones de base de datos
├── scripts/              # Scripts de utilidad
│   ├── setup-local-dev.ts    # Setup interactivo
│   ├── run-neon-setup.ts     # Inicializar DB
│   └── check-neon-status.ts  # Verificar estado
├── public/               # Archivos estáticos
└── wordpress-setup/      # Plugin de WordPress
    └── estatik-rest-api-bridge/  # Plugin personalizado
```

## 🔐 Variables de Entorno

### Desarrollo Local (.env.local)
```env
# Base de datos Neon
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Autenticación
JWT_SECRET="tu-secreto-jwt"

# WordPress (opcional)
WORDPRESS_API_URL="https://tusitio.com/wp-json"
WORDPRESS_USERNAME="usuario"
WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx"
```

**Obtener variables automáticamente:**
```bash
npm run setup:local  # Asistente interactivo
# o
vercel env pull .env.local  # Descargar de Vercel
```

## 🚢 Despliegue en Producción

El proyecto se despliega automáticamente en Vercel cuando haces push a la rama main.

### ⚠️ IMPORTANTE: Configurar Variables de Entorno en Vercel

**Antes de hacer deploy, DEBES configurar las variables de entorno en Vercel Dashboard:**

#### Paso 1: Obtener URL de Neon

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Selecciona tu proyecto
3. Ve a **Connection Details**
4. Copia la **Connection String** completa

Ejemplo: `postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb`

#### Paso 2: Configurar en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings → Environment Variables**
4. Agrega las siguientes variables:

```env
# Base de Datos (REQUERIDO)
DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Autenticación (REQUERIDO)
JWT_SECRET=tu-secreto-jwt-muy-seguro-aqui-minimo-32-caracteres

# WordPress (Opcional - solo si usas sincronización)
WORDPRESS_API_URL=https://tu-wordpress.com/wp-json
WORDPRESS_USERNAME=tu-usuario
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

**⚠️ IMPORTANTE:**
- La URL de Neon DEBE incluir `?sslmode=require` al final
- El `JWT_SECRET` debe ser diferente al de desarrollo y muy seguro
- Sin estas variables, el deploy fallará con error de conexión a base de datos

#### Paso 3: Deploy

```bash
git push origin main  # Deploy automático
```

Vercel detecta automáticamente el push y hace deploy.

#### Paso 4: Verificar Deploy

1. Ve a **Deployments** en Vercel
2. Haz clic en el último deployment
3. Ve a **Build Logs**
4. Busca el mensaje: `[v0] Database connected successfully in production`

Si ves este mensaje, ¡todo funciona correctamente! 🎉

### Solución de Problemas en Producción

#### Error: "Can't reach database server at localhost:5432"

**Causa:** Las variables de entorno NO están configuradas en Vercel.

**Solución:** 
1. Configura `DATABASE_URL` en Vercel Settings → Environment Variables
2. Redeploy desde Vercel Dashboard

#### Error: "P1001: Can't reach database server"

**Causas posibles:**
- URL de Neon incorrecta
- Falta `?sslmode=require` al final de la URL
- Proyecto de Neon pausado o eliminado

**Solución:**
1. Verifica que la URL sea correcta
2. Asegúrate de agregar `?sslmode=require`
3. Verifica que tu proyecto de Neon esté activo en console.neon.tech

**📖 Guía completa de deployment en producción**: Ver [VERCEL-ENV-SETUP.md](./VERCEL-ENV-SETUP.md)

### Configuración Rápida (Resumen)

1. **Conectar repositorio a Vercel** ✓
2. **Configurar variables en Vercel Dashboard** (ver arriba)
3. **Push a GitHub**:
   ```bash
   git push origin main  # Deploy automático
   ```

## 📚 Documentación

- **[ADMIN-SETUP.md](./ADMIN-SETUP.md)** → Guía para crear usuario administrador
- **[LOCAL-DEV-SETUP.md](./LOCAL-DEV-SETUP.md)** → Guía completa de configuración local con Neon
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** → Guía de despliegue en producción
- **[NEON-SETUP.md](./NEON-SETUP.md)** → Configuración específica de Neon
- **[wordpress-setup/README.md](./wordpress-setup/README.md)** → Guía de integración con WordPress

## 🔄 Flujo de Trabajo

### Desarrollo Diario

1. **Actualizar código**
   ```bash
   git pull origin main
   npm install  # Si hay nuevas dependencias
   ```

2. **Aplicar migraciones** (si hay nuevas)
   ```bash
   npm run db:migrate:deploy
   npx prisma generate
   ```

3. **Iniciar desarrollo**
   ```bash
   npm run dev
   ```

### Cambios en el Schema

1. Modificar `prisma/schema.prisma`
2. Crear migración:
   ```bash
   npm run db:migrate
   ```
3. Commitear cambios:
   ```bash
   git add prisma/
   git commit -m "feat: agregar campo X"
   git push
   ```

## 🐛 Solución de Problemas

### Error: "Can't reach database server at host:5432"
Tu archivo `.env` no está configurado o tiene valores placeholder. Ejecuta:
```bash
npm run setup:env           # Configurar interactivamente
```
O consulta [ENV-SETUP-GUIDE.md](./ENV-SETUP-GUIDE.md) para configuración manual.

### Error: "Datasource block is missing in schema.prisma"
Tu archivo `prisma/schema.prisma` está desactualizado. Ejecuta:
```bash
git pull origin main        # Actualizar desde GitHub
```

### Error: "Environment variables not found"
```bash
npm run verify:env          # Verificar configuración
npm run setup:env           # Reconfigurar archivo .env
```

## 👥 Credenciales por Defecto

Después de ejecutar `npm run admin:quick`:

- **Email**: admin@mahler.com
- **Password**: Admin123!
- **Rol**: ADMIN

**⚠️ Importante**: Cambia estas credenciales después del primer inicio de sesión.

Para más información: Ver [ADMIN-SETUP.md](./ADMIN-SETUP.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario de Mahler Propiedades.

---

Desarrollado con ❤️ por Mahler Propiedades

**¿Necesitas ayuda?** Consulta la [documentación completa](./LOCAL-DEV-SETUP.md) o ejecuta `npm run setup:local`
