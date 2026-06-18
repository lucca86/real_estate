# Plan: Módulo de Gestión de Tareas

## Resumen Ejecutivo

Se propone un módulo de tareas **dual-vista (Lista + Kanban)** integrado al sistema de permisos existente (`role_permissions` / `PERMISSION_GROUPS`), con relación a usuarios, asignación por supervisores/admins y visibilidad configurable por rol — exactamente como funciona el módulo de Catálogo.

---

## Análisis de Alternativas

### Opción A — Lista estilo Google Tasks
- Vista lineal con título, descripción, fecha de vencimiento y prioridad.
- Simple, rápida de escanear, ideal para tareas personales del agente.
- Limitada para trabajo en equipo: no refleja el estado del flujo de trabajo.
- **Adecuada para:** agentes individuales gestionando su lista diaria.

### Opción B — Kanban con columnas
- Tablero visual de columnas arrastrables.
- Excelente para seguimiento de flujo de trabajo en equipo.
- Más complejo de implementar (drag & drop).
- **Adecuada para:** supervisores/admins que necesitan ver el estado global del equipo.

### Opción C — Vista Dual (PROPUESTA RECOMENDADA)
Combina ambas en una sola pantalla con toggle de vista, al estilo Linear y Notion:
- El usuario elige entre **Lista** o **Kanban** con un botón de cambio de vista.
- La preferencia de vista se persiste por usuario en la base de datos.
- Ambas vistas comparten el mismo datasource, filtros y acciones.
- **Adecuada para:** todo el equipo, cada usuario usa la vista que prefiere.

**Decision: Opción C — Vista Dual.**

---

## Diseño del Módulo

### Vista Lista
- Tabla agrupada por estado con checkbox de completado rápido.
- Columnas: Título, Asignado a, Propiedad vinculada, Prioridad, Vencimiento, Estado.
- Click en una fila abre un Sheet lateral con el detalle completo.
- Filtros: Mis tareas / Todas las tareas, estado, prioridad, vencimiento, asignado a.

### Vista Kanban
- 5 columnas fijas: **Pendiente → En Progreso → En Revisión → Completada → Cancelada**
- Cards con: título, avatar del asignado, propiedad vinculada, indicador de prioridad, fecha de vencimiento.
- Drag & drop entre columnas para cambiar estado (solo el asignado o admin/supervisor).
- Columnas colapsables para maximizar espacio en pantallas chicas.

### Panel de Detalle — Sheet lateral (compartido entre ambas vistas)
Campos editables inline sin ir a otra página:
- Título y descripción.
- Estado (select).
- Prioridad: Baja / Media / Alta / Urgente (con color distintivo).
- Creado por (solo lectura, con fecha).
- Asignado a (select de usuarios activos — solo admin/supervisor puede cambiar).
- Propiedad vinculada (opcional — selector de propiedad del sistema).
- Fecha de vencimiento.
- Historial de actividad y comentarios.

---

## Modelo de Datos (Supabase)

### Tabla `tasks`
```sql
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','in_progress','in_review','completed','cancelled')),
  priority     TEXT NOT NULL DEFAULT 'medium'
               CHECK (priority IN ('low','medium','high','urgent')),
  created_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  property_id  UUID REFERENCES properties(id) ON DELETE SET NULL,
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

### Tabla `task_comments`
```sql
CREATE TABLE task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'comment'
             CHECK (type IN ('comment', 'activity')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Preferencia de vista en `users`
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS task_view_preference TEXT DEFAULT 'list'
  CHECK (task_view_preference IN ('list', 'kanban'));
```

**Nota sobre RLS:** Las tablas `tasks` y `task_comments` deben tener RLS habilitado. Todos los accesos del servidor deben usar `createAdminClient()` (service role) para bypassear RLS, igual que el resto del sistema.

---

## Sistema de Permisos

Se integra al sistema existente en `lib/permissions-config.ts` agregando un nuevo grupo `tasks` al array `PERMISSION_GROUPS`. Los defaults se insertan en la tabla `role_permissions` de Supabase.

### Nuevos permisos a agregar:

```typescript
{
  name: "tasks",
  label: "Tareas",
  permissions: [
    { key: "tasks.view",     label: "Ver módulo",   description: "Acceso al módulo de tareas" },
    { key: "tasks.create",   label: "Crear tareas", description: "Crear nuevas tareas" },
    { key: "tasks.edit",     label: "Editar",       description: "Editar tareas propias" },
    { key: "tasks.delete",   label: "Eliminar",     description: "Eliminar tareas" },
    { key: "tasks.assign",   label: "Asignar",      description: "Asignar tareas a otros usuarios (Supervisor/Admin)" },
    { key: "tasks.view_all", label: "Ver todas",    description: "Ver tareas de todos los usuarios, no solo las propias" },
  ],
}
```

### Comportamiento por rol (defaults iniciales):

| Permiso            | ADMIN | SUPERVISOR | VENDEDOR              |
|--------------------|-------|------------|-----------------------|
| tasks.view         | true  | true       | true                  |
| tasks.create       | true  | true       | true                  |
| tasks.edit         | true  | true       | true (solo propias)   |
| tasks.delete       | true  | true       | false                 |
| tasks.assign       | true  | true       | false                 |
| tasks.view_all     | true  | true       | false                 |

**Reglas de visibilidad:**
- `tasks.view = false` → el módulo desaparece del sidebar completamente (igual que `catalog.view`).
- `tasks.view_all = false` → el usuario solo ve tareas donde es `created_by` o `assigned_to`.
- `tasks.assign = false` → el campo "Asignado a" se fija en el usuario actual (solo lectura).
- `tasks.delete = false` → el botón de eliminar no aparece en la UI.

---

## Arquitectura de Archivos

```
app/(dashboard)/tasks/
  page.tsx                  — Server Component: data fetching + validación de permisos

components/
  tasks-list-view.tsx       — Vista lista con filtros y tabla (Client Component)
  tasks-kanban-view.tsx     — Vista kanban con drag & drop (Client Component)
  task-detail-sheet.tsx     — Sheet lateral de detalle/edición
  task-card.tsx             — Card reutilizable (kanban y lista)
  task-filters.tsx          — Filtros compartidos entre vistas
  task-view-toggle.tsx      — Botón toggle Lista/Kanban con persistencia

lib/actions/
  tasks.ts                  — Server Actions: CRUD completo + cambio de estado + asignación
```

---

## Integración con el Sidebar

En `components/app-sidebar.tsx`, mismo patrón exacto que Catálogo:

```typescript
// Agregar al array de items del sidebar, condicionado al permiso:
if (permissions["tasks.view"]) {
  sidebarItems.push({
    title: "Tareas",
    url: "/tasks",
    icon: CheckSquare,
    badge: overdueCount > 0 ? overdueCount : undefined, // tareas vencidas
  })
}
```

---

## Funcionalidades Diferenciadoras

### 1. Vinculación a Propiedades
Cada tarea puede vincularse a una propiedad del sistema. Desde la ficha de una propiedad, un tab "Tareas" muestra las tareas vinculadas (ej: "Fotografiar", "Redactar descripción", "Publicar en portal").

### 2. Badge de vencimiento en el Sidebar
Muestra el conteo de tareas vencidas o con vencimiento hoy directamente en el ítem del sidebar. Urgencia visual inmediata sin necesidad de entrar al módulo.

### 3. Filtro rapido "Mis Tareas / Todas"
Toggle en la cabecera de la página. Para VENDEDOR solo aparece "Mis Tareas" ya que no tiene `tasks.view_all`. Para ADMIN/SUPERVISOR se puede filtrar por usuario específico.

### 4. Historial de Actividad
Cada cambio de estado, reasignación o edición importante queda registrado en `task_comments` con `type = 'activity'`, diferenciado visualmente de los comentarios de texto. Se integra con `lib/audit.ts` existente.

### 5. Indicadores Visuales de Prioridad
- Urgente: borde/dot rojo + ícono de llama
- Alta: naranja
- Media: amarillo/ámbar
- Baja: gris/slate

### 6. Acceso Rápido desde Propiedades
Desde la ficha de edición de una propiedad, un widget lateral muestra las tareas vinculadas y permite crear una nueva sin salir del contexto de la propiedad.

---

## Orden de Implementación

1. **Schema DB** — Crear `tasks`, `task_comments` en Supabase. Agregar `task_view_preference` en `users`.
2. **Permisos** — Agregar grupo `tasks` en `permissions-config.ts`. Insertar defaults en `role_permissions` via SQL.
3. **Server Actions** — `lib/actions/tasks.ts` con CRUD completo y lógica de visibilidad por permiso.
4. **Vista Lista** — `tasks-list-view.tsx` + `task-detail-sheet.tsx` + `task-filters.tsx`.
5. **Vista Kanban** — `tasks-kanban-view.tsx` con drag & drop via `@dnd-kit/core`.
6. **Page principal** — `app/(dashboard)/tasks/page.tsx` integrando ambas vistas con el toggle.
7. **Sidebar** — Agregar ítem "Tareas" con badge de vencimiento condicionado al permiso.
8. **Vinculación a Propiedades** — Tab/widget de tareas en la ficha de propiedad (segunda iteración).

---

## Dependencias Nuevas

- `@dnd-kit/core` + `@dnd-kit/sortable` — drag & drop accesible y liviano para el Kanban.
- Todo lo demás reutiliza shadcn/ui ya instalado en el proyecto (`Sheet`, `Badge`, `Select`, `Checkbox`, `Avatar`, etc.).

---

## Notas de UX

- Mismo diseño, paleta de colores y componentes que el resto del sistema. No se introduce ningún estilo nuevo.
- Vista Kanban en mobile: una sola columna visible a la vez, con selector de columna en la parte superior.
- Tareas completadas y canceladas se ocultan por defecto, con toggle "Mostrar archivadas" para revelarlas.
- Nueva tarea: siempre desde un Sheet lateral para no interrumpir el flujo de trabajo, consistente con Citas y otros módulos.
- El campo "Asignado a" muestra avatar + nombre del usuario, no solo el ID.
