# ANÁLISIS PROFUNDO DE ERRORES DEL SISTEMA

## 📋 PROBLEMAS IDENTIFICADOS

### 1. ❌ NOTAS INTERNAS NO APARECEN
**Síntoma**: Campo `internal_notes` no se muestra en el formulario de propiedades.

**Causa Raíz**:
- La columna `internal_notes` EXISTS en la tabla `properties` de la BD ✓
- PERO no hay código que maneje este campo:
  - ❌ No existe en `components/property-form.tsx` (form state, handlers, JSX)
  - ❌ No se extrae en `properties.ts` (createProperty/updateProperty)
  - ❌ No se mapea en `edit/page.tsx` (property mapping)

**Impacto**: 
- Los usuarios no pueden ver ni editar notas internas
- Se pierden datos si existen en la BD

**Solución**: Agregar campo `internal_notes` completo al flujo.

---

### 2. ❌ SISTEMA DE PERMISOS ROTO - TABLA VACÍA
**Síntoma**: Errores en muchos lugares. Funciones que consultan `role_permissions` pero está vacía.

**Causa Raíz**:
- Tabla `role_permissions` existe pero **está VACÍA** (0 registros)
- `lib/permissions.ts` intenta leer permisos de esta tabla
- Las funciones `checkPermission()`, `checkPermissions()`, etc. retornan FALSE para todos
- Esto causa que todas las validaciones de permisos fallen

**Estado Actual**:
```sql
SELECT * FROM role_permissions; -- Retorna: (empty set)
```

**Por qué está vacía**:
- El script SQL `05-create-permissions-system.sql` probablemente creó la estructura pero no los datos
- Nunca se ejecutó un `INSERT INTO role_permissions` con los datos de roles (ADMIN, SUPERVISOR, REAL_ESTATE_AGENT, etc.)

**Impacto**:
- Cualquier código que use `checkPermission()` fallará
- Usuarios no pueden acceder a funciones aunque deberían poder
- Errores silenciosos o excepciones no capturadas

**Solución**: Poblar la tabla `role_permissions` con datos reales.

---

### 3. ❌ RLS POLICIES USAN get_user_role() - FUNCIÓN CRÍTICA PERO POSIBLEMENTE ROTA
**Síntoma**: Acceso denegado a propiedades, errores de permisos.

**Causa Raíz**:
- Las 3 RLS policies en `properties` usan función `get_user_role()`:
  - "Admin and supervisor full access" → `get_user_role() = ANY(ARRAY['admin'::text, 'supervisor'::text])`
  - "Real estate agents can manage properties" → `get_user_role() = 'real_estate_agent'`
  - "Service role has full access" → `true` (siempre pasa)

- **PROBLEMA**: Probablemente la función `get_user_role()` retorna un valor incorrecto o NULL
  - No está sincronizada con la columna `role` de la tabla `users`
  - O no obtiene correctamente el rol del usuario autenticado

**Impacto**:
- Users bloqueados de crear/editar propiedades incluso con permisos correctos
- Solo el service role (Supabase) puede acceder

**Solución**: Verificar e implementar `get_user_role()` correctamente.

---

### 4. ⚠️ WORDPRESS SYNC - POSIBLES ERRORES EN SINCRONIZACIÓN
**Estado**:
- `lib/wordpress.ts` existe y tiene lógica compleja
- Hay console.log("[v0]") que deben removerse de producción
- Posibles errores en mapeo de datos o credenciales

**Potenciales Issues**:
- ✓ Está usando las credenciales correctas (env vars)
- ✓ Maneja errores de API
- ? Pero no sé si WordPress está sincronizando correctamente

**Solución**: Revisar logs de sincronización.

---

### 5. ❌ FALTA DE CAMPO internal_notes EN CREATEPROPERTY/UPDATEPROPERTY
**Síntoma**: Aunque agregue `internal_notes` al form, las acciones no lo procesan.

**Causa**:
- `createProperty()` en `properties.ts`:
  - No extrae `internal_notes` de `formData` (línea ~50+)
  - No lo incluye en el INSERT a la BD

- `updateProperty()` similar:
  - No lee ni actualiza `internal_notes`

**Solución**: Agregar extracción y mapeo de `internal_notes`.

---

## 📊 DIAGNÓSTICO RESUMIDO

| Componente | Estado | Severidad | Causa |
|-----------|--------|-----------|-------|
| internal_notes campo | ❌ Missing | ALTA | No implementado en código |
| role_permissions data | ❌ Vacía | CRÍTICA | No populada en BD |
| get_user_role() RLS | ⚠️ Unclear | ALTA | Posiblemente retorna mal |
| wordpress sync | ⚠️ Unknown | MEDIA | Revisar logs |
| permissions system | ⚠️ Partially broken | ALTA | role_permissions vacía |

---

## 🛠️ PLAN DE SOLUCIÓN (PRIORIDAD)

### 1️⃣ CRÍTICO: Poblar role_permissions
```sql
INSERT INTO role_permissions (role, permission, enabled) VALUES
('ADMIN', 'view_properties', true),
('ADMIN', 'create_properties', true),
('ADMIN', 'edit_properties', true),
('ADMIN', 'delete_properties', true),
('ADMIN', 'manage_wordpress_sync', true),
('ADMIN', 'view_internal_notes', true),
('ADMIN', 'edit_internal_notes', true),

('SUPERVISOR', 'view_properties', true),
('SUPERVISOR', 'view_internal_notes', true),
('SUPERVISOR', 'edit_internal_notes', true),

('REAL_ESTATE_AGENT', 'view_properties', true),
('REAL_ESTATE_AGENT', 'create_properties', true),
('REAL_ESTATE_AGENT', 'edit_properties', true),
-- NO delete, NO sync
;
```

### 2️⃣ ALTA: Implementar internal_notes en el formulario
- Agregar estado en `property-form.tsx`
- Agregar handler onChange
- Agregar JSX textarea
- Agregar extracción en `createProperty/updateProperty`
- Agregar mapeo en edit/page.tsx

### 3️⃣ ALTA: Verificar get_user_role() function en BD
```sql
SELECT * FROM pg_proc WHERE proname = 'get_user_role';
-- Verify implementation
```

### 4️⃣ MEDIA: Cleanup
- Remover console.log("[v0]") de `lib/wordpress.ts`
- Agregar logs adecuados de errores

---

## 🔍 SIGUIENTE PASO
Necesito que apruebes el plan para que ejecute los fixes en orden.
