# Guía de Inicio - Real Estate Management

Esta guía te ayudará a configurar el proyecto localmente y desplegarlo en producción.

## 📋 Prerequisitos

- Node.js 18+ instalado
- Cuenta en [Neon](https://neon.tech) (base de datos PostgreSQL)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deployment)

## 🚀 Configuración Local

### Paso 1: Clonar el repositorio

```bash
git clone <tu-repositorio>
cd real_state
```

### Paso 2: Instalar dependencias

```bash
npm install
```

**IMPORTANTE:** Si obtienes un error `You don't have any datasource defined`, es porque falta el archivo `.env`. Continúa con el siguiente paso.

### Paso 3: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos Neon
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@host/database?sslmode=require"

# JWT Secret (cámbialo en producción)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# WordPress (opcional)
WORDPRESS_API_URL="https://tu-wordpress.com/wp-json"
WORDPRESS_USERNAME="admin"
WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

**¿Dónde encuentro mis credenciales de Neon?**

1. Ve a [https://console.neon.tech](https://console.neon.tech)
2. Selecciona tu proyecto
3. Ve a **Connection Details**
4. Copia el **Connection String** y reemplaza `DATABASE_URL`
5. Para `DATABASE_URL_UNPOOLED`, usa la misma URL pero agrega `?sslmode=require` al final

### Paso 4: Generar el cliente de Prisma

```bash
npx prisma generate
```

Este comando genera los tipos TypeScript necesarios basados en tu esquema de base de datos.

### Paso 5: Inicializar la base de datos

Ejecuta el script de configuración que creará todas las tablas y datos iniciales:

```bash
npm run db:setup
```

Este script:
- ✅ Crea todas las tablas (usuarios, propiedades, clientes, etc.)
- ✅ Inserta datos iniciales (tipos de propiedad, países, provincias, ciudades)
- ✅ Crea un usuario administrador por defecto

**Credenciales del administrador:**
- Email: `admin@mahler.com`
- Password: `Admin123!`

### Paso 6: Verificar la configuración

```bash
npm run db:status
```

Este comando verifica que todas las tablas estén creadas correctamente.

### Paso 7: Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Comandos de Base de Datos

```bash
# Inicializar base de datos (tablas + datos)
npm run db:setup

# Verificar estado de la base de datos
npm run db:status

# Resetear base de datos (CUIDADO: elimina todos los datos)
npm run db:reset

# Ver el schema en Prisma Studio
npx prisma studio
```

## 🌍 Despliegue en Vercel

### Paso 1: Conectar con GitHub

Tu proyecto ya está conectado a GitHub y Vercel.

### Paso 2: Configurar variables de entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
DATABASE_URL=<tu-url-de-neon>
DATABASE_URL_UNPOOLED=<tu-url-de-neon-unpooled>
JWT_SECRET=<genera-un-secret-seguro>
WORDPRESS_API_URL=<opcional>
WORDPRESS_USERNAME=<opcional>
WORDPRESS_APP_PASSWORD=<opcional>
```

### Paso 3: Inicializar base de datos de producción

Desde tu terminal local, pero usando la URL de producción:

```bash
# Opción 1: Usar Vercel CLI
DATABASE_URL="<tu-url-de-produccion>" npm run db:setup

# Opción 2: Ejecutar scripts SQL directamente en Neon Console
# Ve a Neon Console → SQL Editor y ejecuta los scripts en scripts/
```

### Paso 4: Deploy automático

Cada vez que hagas push a la rama `main`, Vercel desplegará automáticamente.

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

## 🔧 Solución de Problemas

### Error: "You don't have any datasource defined"

**Causa:** Falta el archivo `.env` o `DATABASE_URL` no está definido.

**Solución:**
1. Crea el archivo `.env` en la raíz del proyecto
2. Agrega `DATABASE_URL="..."`
3. Ejecuta `npx prisma generate`

### Error: "Can't reach database server"

**Causa:** La URL de conexión a Neon es incorrecta o la base de datos no está accesible.

**Solución:**
1. Verifica que la URL sea correcta
2. Asegúrate de que incluya `?sslmode=require`
3. Verifica que tu IP esté permitida en Neon (ve a Settings → IP Allow)

### Error: "Table does not exist"

**Causa:** Las tablas no se han creado en la base de datos.

**Solución:**
```bash
npm run db:setup
```

### El login no funciona

**Causa:** No existe el usuario administrador.

**Solución:**
```bash
npm run db:setup
# Luego inicia sesión con: admin@mahler.com / Admin123!
```

## 📚 Próximos Pasos

- [ ] Cambiar la contraseña del administrador
- [ ] Agregar tipos de propiedad adicionales
- [ ] Configurar integración con WordPress (opcional)
- [ ] Cargar propiedades iniciales
- [ ] Personalizar el tema y colores

## 🆘 Soporte

Si tienes problemas, revisa:
1. Este archivo GETTING-STARTED.md
2. DEPLOYMENT.md para detalles de producción
3. NEON-SETUP.md para información específica de Neon

¿Aún tienes problemas? Verifica que:
- Node.js versión 18+ esté instalado
- Todas las dependencias estén instaladas (`npm install`)
- El archivo `.env` exista y tenga las variables correctas
- La base de datos de Neon esté activa
