# ANÁLISIS PROFUNDO DEL SISTEMA Y PLAN DE FIXES

## 1. PROBLEMA PRINCIPAL: NOTAS INTERNAS NO SE MUESTRAN

### Síntoma
- La columna `internal_notes` existe en la BD pero no aparece en el formulario
- No hay campo en el UI para editar o ver notas internas

### Causa Raíz
- **property-form.tsx** NO tiene un campo para `internal_notes`
- **properties.ts (createProperty y updateProperty)** NO incluyen `internal_notes` en los payloads
- **edit/page.tsx** NO mapea `internal_notes` del objeto property

### Archivos Afectados
```
❌ /components/property-form.tsx - Falta campo de notas internas
❌ /lib/actions/properties.ts - No envía internal_notes en INSERT/UPDATE
❌ /app/(dashboard)/properties/[id]/edit/page.tsx - No mapea internal_notes
```

---

## 2. PROBLEMAS DE PERMISOS

### Estado Actual
- Tabla `role_permissions` EXISTE con 3 roles: ADMIN, SUPERVISOR, VENDEDOR
- Archivo `/lib/permissions.ts` EXISTE y tiene lógica de permisos
- **PERO**: `properties.ts` NO usa la función de permisos

### Síntoma
- Usuarios sin permisos pueden hacer CRUD de propiedades
- No hay validación de permisos en las operaciones

### Causa Raíz
- **properties.ts** NO llama a `checkPermission()` o equivalente
- No hay verificación de permisos antes de INSERT/UPDATE/DELETE
- Las RLS policies EXISTEN pero pueden no estar correctamente sincronizadas con la lógica de permisos

### Archivos Afectados
```
❌ /lib/actions/properties.ts - Falta validación de permisos
❌ /lib/permissions.ts - Implementado pero no usado
```

---

## 3. PROBLEMAS DE SINCRONIZACIÓN CON WORDPRESS

### Estado Actual
- Función `syncToWordPress()` en **properties.ts** intenta sincronizar
- Genera `wordpress_id`, actualiza `synced_at`

### Síntoma
- Posibles errores en sincronización si las operaciones CRUD fallan

### Causa Raíz
- La sincronización depende del éxito de las operaciones CRUD
- Si hay errores de permisos RLS, la sincronización puede fallar silenciosamente
- No hay logging robusto de errores de sincronización

### Archivos Afectados
```
⚠️ /lib/actions/properties.ts - Sincronización depende de CRUD exitoso
⚠️ /lib/wordpress.ts - Podría tener errores silenciosos
```

---

## 4. ANÁLISIS DE RLS POLICIES

### Políticas Detectadas
```sql
- SELECT: allows anonymous users (NO hay restricción)
- INSERT: requires column_name = auth.uid() (BLOQUEA si auth.uid() no coincide)
- UPDATE: requires column_name = auth.uid() (BLOQUEA si auth.uid() no coincide)
- DELETE: NO POLICY (BLOQUEA por defecto)
```

### Problema Crítico
- **DELETE** no tiene política → todos los DELETE son bloqueados
- **INSERT/UPDATE** requieren que `column_name = auth.uid()` pero ¿qué columna?
- Si `created_by_id` es la columna, solo usuarios pueden editar sus propias propiedades

---

## 5. PLAN DE FIXES SISTEMÁTICO

### FASE 1: AGREGAR NOTAS INTERNAS AL UI (URGENTE)
1. Agregar campo `internal_notes` a `property-form.tsx`
2. Agregar mapeo de `internal_notes` en `edit/page.tsx`
3. Agregar `internal_notes` a `createProperty()` payload
4. Agregar `internal_notes` a `updateProperty()` payload

### FASE 2: IMPLEMENTAR VALIDACIÓN DE PERMISOS (CRÍTICO)
1. Agregar `checkPermission()` calls en `createProperty()`
2. Agregar `checkPermission()` calls en `updateProperty()`
3. Agregar `checkPermission()` calls en `deleteProperty()`
4. Definir permisos requeridos por operación

### FASE 3: FIXES DE RLS (IMPORTANTE)
1. Verificar qué columna usa RLS (probablemente `created_by_id`)
2. Agregar política DELETE si falta
3. Asegurar que `created_by_id` se asigna correctamente en INSERT
4. Verificar sincronización con `auth.uid()`

### FASE 4: MEJORAR SINCRONIZACIÓN CON WORDPRESS (IMPORTANTE)
1. Agregar logging robusto
2. Manejar errores de sincronización
3. Implementar reintentos

---

## 6. MATRIZ DE RESPONSABILIDADES POR ARCHIVO

| Archivo | Problema | Fix |
|---------|----------|-----|
| property-form.tsx | Falta campo notas | Agregar textarea para internal_notes |
| edit/page.tsx | No mapea internal_notes | Agregar `internalNotes: propertyData.internal_notes` |
| properties.ts | No incluye internal_notes en payloads | Agregar campo en INSERT y UPDATE |
| properties.ts | No valida permisos | Agregar `checkPermission()` calls |
| properties.ts | No sincroniza bien errores | Mejorar error handling de WordPress |
| permissions.ts | No se usa | Integrar en properties.ts |

---

## 7. ORDEN DE EJECUCIÓN

```
PRIORIDAD 1 (BLOQUEADOR):
  1. Arreglar field internal_notes en property-form
  2. Arreglar mapeo en edit/page
  3. Arreglar payloads en properties.ts

PRIORIDAD 2 (CRÍTICO):
  4. Implementar permisos en properties.ts
  5. Verificar RLS policies

PRIORIDAD 3 (IMPORTANTE):
  6. Mejorar error handling de WordPress
  7. Agregar logging
```

---

## 8. PRÓXIMOS PASOS

1. Aplicar fixes de Prioridad 1 (5-10 min)
2. Aplicar fixes de Prioridad 2 (10-15 min)
3. Testing
4. Aplicar fixes de Prioridad 3 (5-10 min)
