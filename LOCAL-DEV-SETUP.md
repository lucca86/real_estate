# Configuración de Entorno Local con Neon

Esta guía te ayudará a configurar tu entorno de desarrollo local para usar la misma base de datos Neon que producción.

## 📋 Requisitos Previos

- Node.js instalado (versión 18 o superior)
- Cuenta de Vercel con proyecto conectado
- Base de datos Neon conectada a tu proyecto de Vercel

## 🚀 Pasos de Configuración

### 1. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias, incluyendo `tsx` para ejecutar scripts TypeScript.

### 2. Obtener las Variables de Entorno de Vercel

Tienes dos opciones:

#### Opción A: Usar Vercel CLI (Recomendado)

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Autenticarse
vercel login

# Link al proyecto
vercel link

# Descargar variables de entorno
vercel env pull .env.local
```

#### Opción B: Copiar Manualmente desde Vercel Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Copia las siguientes variables:

```env
# Base de datos Neon
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# WordPress (si aplica)
WORDPRESS_API_URL="https://..."
WORDPRESS_USERNAME="..."
WORDPRESS_APP_PASSWORD="..."

# JWT
JWT_SECRET="..."
```

4. Crea un archivo `.env.local` en la raíz del proyecto y pega las variables

### 3. Verificar la Conexión a Neon

```bash
npm run db:status
```

Este comando verificará:
- ✅ Conexión a la base de datos
- ✅ Tablas existentes
- ✅ Estado de las migraciones

### 4. Inicializar la Base de Datos (Solo Primera Vez)

Si la base de datos está vacía o necesitas recrearla:

```bash
# Opción 1: Setup completo (crea tablas + datos iniciales)
npm run db:setup

# Opción 2: Solo crear tablas (sin datos)
npx prisma db push

# Opción 3: Usar migraciones de Prisma (recomendado para producción)
npx prisma migrate deploy
```

### 5. Generar el Cliente de Prisma

```bash
npx prisma generate
```

### 6. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Tu aplicación estará disponible en `http://localhost:3000`

## 🔧 Comandos Útiles

### Base de Datos

```bash
# Ver estado de la base de datos
npm run db:status

# Inicializar base de datos completa
npm run db:setup

# Resetear base de datos (¡CUIDADO! Elimina todo)
npm run db:reset

# Ver base de datos en el navegador
npx prisma studio

# Sincronizar schema sin migraciones (desarrollo)
npx prisma db push

# Crear una nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy
```

### Datos Iniciales

```bash
# Seed de tipos de propiedad
npm run seed:property-types

# Seed de ubicaciones (países, provincias, ciudades)
npm run seed:locations

# Verificar variables de entorno
npm run verify:env
```

## 🌍 Estructura de Variables de Entorno

### `.env.local` (Desarrollo Local)
Usado en tu máquina local, apunta a Neon en la nube.

### Variables de Neon Necesarias

```env
# URL de conexión pooled (para Prisma Client)
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require&pgbouncer=true"

# URL de conexión directa (para migraciones)
DATABASE_URL_UNPOOLED="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
```

## 🔄 Flujo de Trabajo Recomendado

### Desarrollo Diario

1. **Actualizar código**
   ```bash
   git pull origin main
   ```

2. **Actualizar dependencias** (si hubo cambios)
   ```bash
   npm install
   ```

3. **Aplicar migraciones** (si hay nuevas)
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Iniciar desarrollo**
   ```bash
   npm run dev
   ```

### Cambios en el Schema

1. **Modificar** `prisma/schema.prisma`

2. **Crear migración**
   ```bash
   npx prisma migrate dev --name descripcion_cambio
   ```

3. **Generar cliente**
   ```bash
   npx prisma generate
   ```

4. **Commitear cambios**
   ```bash
   git add prisma/schema.prisma prisma/migrations
   git commit -m "feat: agregar campo X al modelo Y"
   git push origin main
   ```

### Sincronizar con Producción

Como ambos ambientes (local y producción) usan la misma base de datos Neon:

- ✅ Los datos son los mismos en desarrollo y producción
- ✅ Las migraciones se aplican automáticamente
- ⚠️ **CUIDADO**: Los cambios en la base de datos afectan inmediatamente a producción

## 🛡️ Mejores Prácticas

### Para Evitar Problemas

1. **Nunca ejecutes `db:reset` en producción**
2. **Usa migraciones en lugar de `db push` en producción**
3. **Prueba las migraciones en una base de datos de prueba primero**
4. **Haz backups antes de cambios importantes**

### Base de Datos Separada para Desarrollo (Opcional)

Si prefieres tener una base de datos separada para desarrollo:

1. Crea una segunda base de datos en Neon
2. Copia la URL de conexión
3. En tu `.env.local`, usa la URL de la base de datos de desarrollo
4. En Vercel, mantén la URL de la base de datos de producción

## 🐛 Solución de Problemas

### Error: "Environment variables not found"

```bash
# Verificar que existan las variables
npm run verify:env

# Si faltan, descargarlas de Vercel
vercel env pull .env.local
```

### Error: "Can't reach database server"

```bash
# Verificar conexión
npm run db:status

# Verificar que la URL sea correcta
echo $DATABASE_URL
```

### Error: "Prisma Client not generated"

```bash
npx prisma generate
```

### Error: "Migration failed"

```bash
# Ver migraciones aplicadas
npx prisma migrate status

# Resolver conflictos
npx prisma migrate resolve --applied "nombre_migracion"

# O resetear (¡CUIDADO!)
npx prisma migrate reset
```

## 📚 Recursos

- [Documentación de Neon](https://neon.tech/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Obtener Ayuda

Si tienes problemas:

1. Revisa los logs: `npm run db:status`
2. Verifica las variables: `npm run verify:env`
3. Consulta esta guía
4. Revisa la documentación de Neon/Prisma
