# Resumen de Correcciones de RLS

## Fecha: 2025-01-XX

## Problema Identificado
Después de habilitar Row Level Security (RLS) en todas las tablas, la página de administración de permisos mostraba todos los permisos deshabilitados porque las funciones estaban usando `createClient()` o `createServerClient()` que respetan las políticas RLS, cuando en realidad necesitan acceso administrativo completo.

## Archivos Corregidos

### 1. lib/actions/permissions.ts
**Cambio**: `createClient()` → `createAdminClient()`
**Razón**: Las operaciones de gestión de permisos son administrativas y necesitan bypasear RLS
**Funciones afectadas**:
- `getRolePermissions()`
- `updateRolePermissions()`

### 2. lib/permissions.ts
**Cambio**: `createClient()` → `createAdminClient()`
**Razón**: La verificación de permisos y obtención de matriz de permisos son operaciones del sistema
**Funciones afectadas**:
- `getPermissionsMatrix()`
- `checkPermission()`

### 3. app/api/permissions/route.ts
**Cambio**: `createServerClient()` → `createAdminClient()`
**Razón**: La API de permisos necesita acceso completo a la tabla `role_permissions`
**Endpoints afectados**:
- GET `/api/permissions`
- PUT `/api/permissions`

### 4. app/api/permissions/initialize/route.ts
**Cambio**: `createServerClient()` → `createAdminClient()`
**Razón**: La inicialización de permisos es una operación administrativa de setup
**Endpoints afectados**:
- POST `/api/permissions/initialize`

### 5. lib/actions/dashboard.ts
**Cambio**: `createServerClient()` → `createAdminClient()`
**Razón**: Las estadísticas del dashboard necesitan acceso completo para mostrar métricas agregadas
**Funciones afectadas**:
- `getDashboardStats()` - especialmente el query de tipos de propiedades

### 6. lib/actions/services.ts
**Cambio**: `createClient()` → `createServerClient()`
**Razón**: Estandarizar el uso del cliente de servidor para operaciones que respetan RLS del usuario actual
**Funciones afectadas**:
- `getAllServices()`
- `getServiceById()`
- `createService()`
- `updateService()`
- `deleteService()`

### 7. lib/actions/contacts.ts
**Cambio**: Mixto - usa `createServerClient()` para Contact y `createAdminClient()` para ContactService
**Razón**: 
- `Contact` tiene políticas RLS que deben respetarse
- `ContactService` es una tabla de relación que necesita acceso administrativo
**Funciones afectadas**:
- `getAllContacts()` - usa ambos clientes
- `getContactById()` - usa ambos clientes
- `createContact()` - usa ambos clientes
- `updateContact()` - usa ambos clientes
- `deleteContact()` - usa servidor
- `getAllServices()` - usa servidor

### 8. lib/supabase/server.ts
**Cambio**: Agregada función `createAdminClient()`
**Contenido**: 
```typescript
export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

## Principios de Decisión

### Usar `createAdminClient()` cuando:
1. **Operaciones del sistema**: Gestión de permisos, configuración, inicialización
2. **Estadísticas agregadas**: Dashboard, reportes que necesitan ver todos los datos
3. **Tablas de relación sin RLS**: Tablas intermedias como ContactService
4. **Operaciones de setup**: Migraciones, seeds, inicializaciones

### Usar `createServerClient()` cuando:
1. **Operaciones de usuario**: CRUD basado en el rol del usuario autenticado
2. **Datos filtrados por rol**: Agentes ven solo sus clientes, etc.
3. **Respeto de políticas RLS**: Cuando las políticas RLS son la seguridad deseada
4. **Operaciones estándar**: Mayoría de las operaciones de la aplicación

### Usar `createClient()` (cliente browser) cuando:
1. **Autenticación**: Login, signup, logout
2. **Operaciones del cliente**: Acciones iniciadas directamente desde componentes del cliente
3. **Interacciones en tiempo real**: Subscripciones, actualizaciones en vivo

## Políticas RLS Aplicadas

### Tabla `role_permissions`
- **Política**: Solo usuarios con rol `admin` pueden acceder
- **Resultado**: Necesita `createAdminClient()` para operaciones administrativas

### Tabla `Service`
- **Política**: Admin/supervisor acceso completo, todos pueden leer
- **Resultado**: `createServerClient()` funciona correctamente

### Tabla `Contact`
- **Política**: Admin/supervisor pueden eliminar, todos los autenticados pueden gestionar
- **Resultado**: `createServerClient()` funciona correctamente

### Tabla `property_types`
- **Política**: Todos autenticados pueden leer, admin/supervisor pueden gestionar
- **Resultado**: Dashboard necesitaba `createAdminClient()` para estadísticas

## Problemas Resueltos

1. ✅ Página de permisos muestra correctamente todos los permisos
2. ✅ Dashboard muestra gráfico "Propiedades por Tipo" correctamente
3. ✅ Operaciones de contactos funcionan con servicios asociados
4. ✅ Todas las operaciones administrativas funcionan sin restricciones RLS
5. ✅ Las políticas RLS protegen los datos según el rol del usuario

## Verificación

Para verificar que todo funciona:

1. **Permisos**: Ir a `/settings/permissions` - debe mostrar la matriz de permisos
2. **Dashboard**: Ir a `/dashboard` - debe mostrar el gráfico de tipos de propiedades
3. **Contactos**: Crear/editar contactos con servicios asociados
4. **Operaciones por rol**: 
   - Como admin: acceso completo
   - Como supervisor: acceso limitado según políticas
   - Como agente: solo ve sus propios datos

## Notas Técnicas

- La `SUPABASE_SERVICE_ROLE_KEY` bypasea todas las políticas RLS
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- `createAdminClient()` solo se debe usar en código del servidor
- Las políticas RLS siguen activas y protegen los datos cuando se usa el cliente estándar
