# 📦 Configuración del Proyecto - Guía Paso a Paso

## 🎯 Objetivo
Configurar tu entorno local para usar Neon (base de datos en la nube) igual que producción.

---

## ✅ Paso 1: Instalar Dependencias

```bash
npm install
```

---

## ✅ Paso 2: Configurar Variables de Entorno

Tu proyecto ya tiene las variables de Neon configuradas en Vercel. Necesitas copiarlas a tu archivo `.env` local.

### Opción A: Copiar desde tu archivo `.env` actual (Recomendado)

Abre tu archivo `.env` y reemplaza estas líneas:

```env
# ❌ REEMPLAZA ESTO:
DATABASE_URL="${real_estate_DATABASE_URL}"
DATABASE_URL_UNPOOLED="${real_estate_DATABASE_URL_UNPOOLED}"

# ✅ CON LAS URLs REALES DE NEON:
DATABASE_URL="postgresql://[usuario]:[password]@[host].neon.tech/[database]?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://[usuario]:[password]@[host].neon.tech/[database]?sslmode=require"
```

### Opción B: Obtener las URLs desde Vercel Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Busca las variables:
   - `real_estate_DATABASE_URL` o `DATABASE_URL`
   - `real_estate_DATABASE_URL_UNPOOLED` o `POSTGRES_URL_NON_POOLING`
4. Cópialas a tu archivo `.env`

### ✅ Verificar Variables

```bash
npm run env:check
```

Si ves `✅ Todas las variables requeridas están configuradas!`, continúa al siguiente paso.

---

## ✅ Paso 3: Generar Cliente de Prisma

```bash
npx prisma generate
```

Este comando genera el cliente de TypeScript para interactuar con la base de datos.

---

## ✅ Paso 4: Crear Tablas en Neon

```bash
npx prisma db push
```

Este comando:
- Crea todas las tablas en tu base de datos Neon
- Sincroniza el schema de Prisma con la base de datos
- NO crea archivos de migración (es perfecto para desarrollo)

---

## ✅ Paso 5: Poblar con Datos Iniciales

```bash
npm run db:seed
```

Esto crea:
- ✅ Usuario administrador (admin@realestate.com / admin123)
- ✅ Tipos de propiedades (Casa, Apartamento, etc.)
- ✅ Países, provincias y ciudades de Argentina
- ✅ Datos de ejemplo

---

## ✅ Paso 6: Iniciar el Servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

**Credenciales de acceso:**
- Email: `admin@realestate.com`
- Password: `admin123`

---

## 🎉 ¡Listo!

Tu entorno local está conectado a Neon en la nube. Todos los cambios que hagas se reflejarán en la misma base de datos que usa tu aplicación en producción (si apuntas a la misma DB).

---

## 🔧 Comandos Útiles

```bash
# Ver el estado de la base de datos
npm run db:status

# Abrir interfaz visual de la base de datos
npx prisma studio

# Verificar variables de entorno
npm run env:check

# Reiniciar la base de datos (⚠️ BORRA TODO)
npm run db:reset

# Ver logs del servidor
npm run dev
```

---

## 🚨 Solución de Problemas

### Error: "No database connection string"

**Problema:** Las variables de entorno no están configuradas correctamente.

**Solución:**
1. Verifica que tu archivo `.env` tenga las URLs reales de Neon (no las variables `${real_estate_...}`)
2. Ejecuta `npm run env:check` para verificar
3. Si es necesario, copia las URLs directamente desde Vercel Dashboard

### Error: "Table does not exist"

**Problema:** Las tablas no se han creado en Neon.

**Solución:**
```bash
npx prisma db push
npm run db:seed
```

### Error al hacer `npm install`

**Problema:** Prisma intenta generar el cliente pero no encuentra DATABASE_URL.

**Solución:**
1. Configura DATABASE_URL en tu `.env` primero
2. Luego ejecuta `npm install`

### La aplicación no inicia

**Solución:**
```bash
# Limpia y reinstala
rm -rf node_modules
rm package-lock.json
npm install
npx prisma generate
npm run dev
```

---

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Neon](https://neon.tech/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)

---

## 💡 Notas Importantes

- **Desarrollo vs Producción:** Si quieres usar bases de datos separadas para desarrollo y producción, crea otra base de datos en Neon y usa su URL en tu `.env` local.

- **Migraciones:** Para cambios en producción, usa `npx prisma migrate dev` en lugar de `db:push`.

- **Seguridad:** NUNCA subas tu archivo `.env` a Git. Ya está en `.gitignore`.
