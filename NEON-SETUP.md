# Configuración de Base de Datos Neon

Esta guía te ayudará a configurar y administrar tu base de datos PostgreSQL en Neon para el proyecto de gestión inmobiliaria.

## 📋 Requisitos Previos

- Cuenta en Vercel con integración de Neon conectada
- Variable de entorno `DATABASE_URL` configurada
- Node.js y npm instalados

## 🚀 Comandos Disponibles

### Configuración Inicial

```bash
npm run db:setup
```

Este comando:
- Crea todas las tablas necesarias
- Configura los tipos enum
- Inserta datos iniciales (países, provincias, ciudades, barrios, tipos de propiedad)
- Crea un usuario administrador por defecto

**Credenciales del Admin:**
- Email: `admin@mahler.com`
- Password: `admin123`

### Verificar Estado

```bash
npm run db:status
```

Muestra:
- Estado de la conexión
- Lista de tablas y cantidad de registros
- Tipos enum configurados
- Tamaño de la base de datos

### Resetear Base de Datos

```bash
npm run db:reset
```

⚠️ **PRECAUCIÓN:** Este comando elimina TODOS los datos y tablas. Úsalo solo si necesitas empezar desde cero.

## 🗂️ Estructura de la Base de Datos

### Tablas Principales

1. **User** - Usuarios del sistema (Admin, Supervisor, Vendedor)
2. **Property** - Propiedades inmobiliarias
3. **Owner** - Propietarios de inmuebles
4. **Client** - Clientes interesados
5. **Appointment** - Citas para visitas

### Tablas de Ubicación

6. **Country** - Países
7. **Province** - Provincias/Estados
8. **City** - Ciudades
9. **Neighborhood** - Barrios

### Tablas de Configuración

10. **PropertyType** - Tipos de propiedad (Casa, Departamento, Terreno, etc.)
11. **Session** - Sesiones de usuario

## 📊 Datos Iniciales

El setup automático incluye:

- **Países:** Argentina, Brasil, Uruguay, Paraguay
- **Provincias:** Corrientes, Chaco, Misiones, Buenos Aires
- **Ciudades:** Corrientes Capital, Goya, Curuzú Cuatiá, Resistencia, etc.
- **Barrios:** Centro, Mburucuyá, 500 Viviendas, Pirayuí, San Benito, Laguna Brava
- **Tipos de Propiedad:** Casa, Departamento, Terreno, Local, Oficina, Galpón, Campo, Quinta

## 🔐 Variables de Entorno

Asegúrate de tener configuradas estas variables:

```env
# Neon Database
DATABASE_URL=postgresql://user:password@host/database
DATABASE_URL_UNPOOLED=postgresql://user:password@host/database

# WordPress Integration
WORDPRESS_API_URL=https://tu-sitio-wordpress.com
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Authentication
JWT_SECRET=tu-secreto-super-seguro
```

## 🔄 Flujo de Trabajo en Producción

### Primera Vez

1. Conectar Neon en Vercel
2. Configurar variables de entorno
3. Ejecutar `npm run db:setup`
4. Verificar con `npm run db:status`
5. Cambiar password del admin

### Actualizaciones del Schema

Si modificas el schema de Prisma:

```bash
# Generar migración
npx prisma migrate dev --name descripcion_cambio

# Aplicar en producción
npx prisma migrate deploy
```

## 🐛 Troubleshooting

### Error: "relation does not exist"

Las tablas no existen. Ejecuta:
```bash
npm run db:setup
```

### Error: "permission denied"

Verifica que el usuario de la base de datos tenga permisos suficientes.

### Error: "connection refused"

Verifica que `DATABASE_URL` esté correctamente configurada.

### Quiero empezar de nuevo

```bash
npm run db:reset
npm run db:setup
```

## 📝 Notas Adicionales

- Los IDs se generan automáticamente usando `cuid()`
- Las fechas se almacenan en UTC
- Los arrays vacíos se inicializan como `[]`
- Los campos opcionales pueden ser `NULL`

## 🔗 Enlaces Útiles

- [Documentación de Neon](https://neon.tech/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
