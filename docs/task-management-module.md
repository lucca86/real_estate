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

---

## Fechas y Recordatorios (MODIFICACION AL PLAN ORIGINAL)

### Fecha de Vencimiento Opcional

La fecha de vencimiento (`due_date`) pasa a ser completamente opcional. Una tarea puede existir sin fecha. Esto se refleja tanto en el schema (columna nullable, sin cambio) como en la UI: el campo de fecha muestra "Sin fecha" por defecto con un botón para agregar una si se necesita.

```sql
-- due_date ya es TIMESTAMPTZ nullable, no se requiere cambio de schema.
-- Solo se ajusta la validación en Server Actions: se elimina cualquier
-- regla que requiera due_date para crear o guardar una tarea.
```

**Comportamiento en vistas:**
- Lista: Las tareas sin fecha aparecen al final de cada grupo de estado, sin indicador de vencimiento.
- Kanban: Los cards sin fecha simplemente no muestran el chip de vencimiento.

---

### Sistema de Recordatorios Programados

Se agrega una tabla `task_reminders` independiente de `due_date`. Esto permite enviar avisos aunque la tarea no tenga fecha de vencimiento, o enviar múltiples recordatorios a distintos usuarios y momentos.

#### Schema

```sql
CREATE TABLE task_reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  notify_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remind_at      TIMESTAMPTZ NOT NULL,
  channels       TEXT[] NOT NULL DEFAULT ARRAY['email'],
               -- valores posibles: 'email', 'whatsapp'
  message        TEXT,          -- mensaje personalizado opcional
  sent_at        TIMESTAMPTZ,   -- NULL = pendiente, filled = ya enviado
  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Index para que pg_cron pueda buscar recordatorios pendientes eficientemente
CREATE INDEX idx_task_reminders_pending
  ON task_reminders (remind_at)
  WHERE sent_at IS NULL;
```

**Comportamiento:**
- Un admin/supervisor puede crear un recordatorio para cualquier usuario (`notify_user_id`).
- Un vendedor solo puede crear recordatorios para sí mismo.
- Se pueden crear varios recordatorios por tarea (ej: "avisar a María en 2 dias" + "avisar a Juan el lunes").
- Un recordatorio se puede crear aunque la tarea no tenga `due_date`.

#### UI — Panel de recordatorios en el Sheet de detalle

Dentro del Sheet de detalle de la tarea, una sección "Recordatorios":
- Botón "Agregar recordatorio".
- Por cada recordatorio: fecha/hora, usuario destinatario, canal (email / WhatsApp / ambos), mensaje opcional.
- Indicador visual: pendiente (reloj) o enviado (check verde).

---

## Notificaciones: Canal Email

### Proveedor recomendado: Resend

**Por qué Resend:**
- Integración nativa con Next.js (paquete `resend` oficial).
- React Email para templates: los correos se diseñan como componentes React.
- Plan gratuito: 3.000 emails/mes (100/día). Para una inmobiliaria con equipo de 5-15 personas, el plan gratuito cubre el 100% del uso.
- Plan Pro ($20/mes): 50.000 emails. Suficiente para escalar a múltiples inmobiliarias.

**Implementación:**

```typescript
// lib/notifications/email.ts
import { Resend } from 'resend'
import { TaskReminderEmail } from '@/emails/task-reminder'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendTaskReminderEmail({
  to,
  taskTitle,
  message,
  taskUrl,
}: {
  to: string
  taskTitle: string
  message?: string
  taskUrl: string
}) {
  await resend.emails.send({
    from: 'Gestión Inmobiliaria <no-reply@tudominio.com>',
    to,
    subject: `Recordatorio: ${taskTitle}`,
    react: TaskReminderEmail({ taskTitle, message, taskUrl }),
  })
}
```

**Template (React Email):** Un email limpio con: nombre de la tarea, mensaje personalizado, botón "Ver tarea" que abre el Sheet directamente, y el nombre de quien generó el recordatorio.

**Requerimiento:** dominio propio verificado en Resend. No funciona con Gmail genérico.

---

## Notificaciones: Canal WhatsApp

### Análisis de Alternativas

#### Opción WA-1 — Meta Cloud API directa (sin BSP intermediario)

- **Costo:** Solo se paga a Meta por conversación. Las primeras 1.000 conversaciones de servicio/mes son gratuitas.
- **Requisito:** Cuenta Meta Business verificada + número de teléfono exclusivo (no puede estar activo en WhatsApp normal o WhatsApp Business App).
- **Complejidad:** Alta. Hay que gestionar manualmente el webhook, el token de acceso, la renovación del token, los templates, y el proceso de verificación de negocio en Meta.
- **Adecuado para:** equipos técnicos con tiempo para mantener la integración.

#### Opción WA-2 — Twilio WhatsApp (RECOMENDADO para implementación inicial)

- **Costo:** Costo de Meta + $0.005 por mensaje. Sin cuota mensual fija.
- **Ventaja:** SDK oficial Node.js (`twilio`), documentación exhaustiva, Sandbox gratuito para desarrollo sin verificar negocio, setup en menos de 1 hora.
- **Para una inmobiliaria de 10 personas**: estimado de 200-500 mensajes/mes → costo total < $5 USD/mes + conversaciones Meta (las de servicio son gratuitas hasta 1.000).
- **Contra:** a volumen alto (>10.000 msg/mes) sale más caro que un BSP con flat fee.

```typescript
// lib/notifications/whatsapp.ts
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function sendTaskReminderWhatsApp({
  to,          // formato: '+5491112345678'
  taskTitle,
  message,
}: {
  to: string
  taskTitle: string
  message?: string
}) {
  await client.messages.create({
    from: 'whatsapp:+14155238886', // número de Twilio/sandbox
    to: `whatsapp:${to}`,
    // En producción: usar template aprobado por Meta.
    // En Sandbox/desarrollo: mensaje libre.
    body: message
      ? `*Recordatorio:* ${taskTitle}\n\n${message}`
      : `*Recordatorio de tarea:* ${taskTitle}`,
  })
}
```

#### Opción WA-3 — 360dialog (alternativa para escala)

- **Costo:** ~€49/mes fijo + costos Meta.
- **Ventaja:** Más barato que Twilio a partir de ~10.000 mensajes/mes. Panel de gestión incluido.
- **Adecuado para:** cuando el uso de WhatsApp crece y se justifica el costo fijo.

### Restriccion Critica de Meta — Templates Obligatorios en Producción

**Este es el punto más importante del canal WhatsApp:**

Meta no permite enviar mensajes de texto libre a usuarios que no han iniciado la conversación primero. Para notificaciones salientes (la inmobiliaria avisa al usuario) se requiere un **Message Template aprobado por Meta**.

El proceso de aprobación tarda entre 24-48 horas y Meta puede rechazar templates.

**Template ejemplo para recordatorio de tarea:**
```
Nombre: task_reminder
Categoría: UTILITY

Hola {{1}}, tienes un recordatorio para la tarea:
*{{2}}*

{{3}}

Para ver el detalle ingresá a tu sistema de gestión.
```
Variables: `{{1}}` nombre del usuario, `{{2}}` título de la tarea, `{{3}}` mensaje personalizado.

**Para el entorno de desarrollo:** Twilio ofrece un Sandbox donde se pueden enviar mensajes libres sin templates, lo que facilita mucho el desarrollo y las pruebas.

### Prerequisito del usuario: número de WhatsApp en perfil

Para que el sistema pueda enviar WhatsApp a un usuario, debe tener su número de teléfono cargado en su perfil (tabla `users`, columna `phone`). El canal WhatsApp solo se mostrará como opción si el usuario destinatario tiene teléfono registrado.

```sql
-- Verificar que users ya tiene columna phone:
-- Si no existe: ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
```

---

## Motor de Envio: pg_cron + Supabase Edge Functions

El envío se realiza en background, no en el request del usuario. Flujo:

```
1. Usuario crea recordatorio → se guarda en task_reminders (sent_at = NULL)
2. pg_cron corre cada 5 minutos → llama a Edge Function 'process-reminders'
3. Edge Function busca recordatorios con remind_at <= now() AND sent_at IS NULL
4. Por cada recordatorio: llama a Resend (email) y/o Twilio (WhatsApp)
5. Marca sent_at = now() en task_reminders
```

```sql
-- Habilitar extensiones en Supabase
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job que corre cada 5 minutos
SELECT cron.schedule(
  'process-task-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/process-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Este enfoque es confiable, no requiere servicios externos adicionales, y el costo es cero (pg_cron está incluido en Supabase).

---

## Variables de Entorno Requeridas

```env
# Email — Resend
RESEND_API_KEY=re_xxxxxxxxxxxx

# WhatsApp — Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Tabla Comparativa de Proveedores

| Criterio              | Resend (Email)         | Twilio WA          | Meta API Directa    | 360dialog          |
|-----------------------|------------------------|--------------------|---------------------|--------------------|
| Setup inicial         | 30 min                 | 1-2 horas          | 2-5 días            | 1-2 días           |
| Costo mensual base    | Gratis (3k emails)     | $0 + $0.005/msg    | $0 (sin BSP)        | €49 fijo           |
| Templates Meta req.   | No aplica              | Si (producción)    | Si                  | Si                 |
| SDK Next.js           | Oficial                | Oficial            | HTTP manual         | HTTP manual        |
| Sandbox dev           | Si                     | Si (gratuito)      | No                  | No                 |
| Recomendado para      | Siempre                | Inicio + escala    | Equipos técnicos    | >10k msg/mes       |

**Recomendación final:** Resend para email + Twilio para WhatsApp. Ambos tienen SDKs oficiales, sandbox de desarrollo gratuito, y costos mínimos para el volumen típico de una inmobiliaria.

---

## Orden de Implementación

### Fase 1 — Core del módulo
1. **Schema DB** — Crear `tasks`, `task_comments`, `task_reminders` en Supabase. Agregar `task_view_preference` y verificar `phone` en `users`.
2. **Permisos** — Agregar grupo `tasks` en `permissions-config.ts`. Insertar defaults en `role_permissions` via SQL.
3. **Server Actions** — `lib/actions/tasks.ts` con CRUD completo y lógica de visibilidad por permiso.
4. **Vista Lista** — `tasks-list-view.tsx` + `task-detail-sheet.tsx` + `task-filters.tsx`.
5. **Vista Kanban** — `tasks-kanban-view.tsx` con drag & drop via `@dnd-kit/core`.
6. **Page principal** — `app/(dashboard)/tasks/page.tsx` integrando ambas vistas con el toggle.
7. **Sidebar** — Agregar ítem "Tareas" con badge de vencimiento condicionado al permiso.

### Fase 2 — Recordatorios y Notificaciones
8. **UI de recordatorios** — Sección dentro del Sheet de detalle para crear/ver/eliminar recordatorios por tarea.
9. **Resend (Email)** — Configurar cuenta Resend, verificar dominio, crear template `TaskReminderEmail` con React Email, implementar `lib/notifications/email.ts`.
10. **Twilio (WhatsApp)** — Configurar cuenta Twilio, activar Sandbox, crear template aprobado por Meta para producción, implementar `lib/notifications/whatsapp.ts`.
11. **Edge Function** — `supabase/functions/process-reminders/index.ts` que procesa la tabla `task_reminders`.
12. **pg_cron** — Configurar job cada 5 minutos en Supabase que llama a la Edge Function.

### Fase 3 — Integraciones adicionales (opcional)
13. **Vinculación a Propiedades** — Tab/widget de tareas en la ficha de propiedad.
14. **Notificación en app** — Toast o badge cuando se le asigna una tarea al usuario logueado (sin servicios externos, via polling o Supabase Realtime).

---

## Dependencias Nuevas

| Paquete | Para qué |
|---|---|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag & drop accesible del Kanban |
| `resend` | Envio de emails transaccionales |
| `react-email` + `@react-email/components` | Templates de email como componentes React |
| `twilio` | SDK oficial para enviar WhatsApp |

Todo lo demás (`Sheet`, `Badge`, `Select`, `Checkbox`, `Avatar`, `Popover`, etc.) reutiliza shadcn/ui ya instalado en el proyecto.

---

## Notas de UX

- Mismo diseño, paleta de colores y componentes que el resto del sistema. No se introduce ningún estilo nuevo.
- Vista Kanban en mobile: una sola columna visible a la vez, con selector de columna en la parte superior.
- Tareas completadas y canceladas se ocultan por defecto, con toggle "Mostrar archivadas" para revelarlas.
- Nueva tarea: siempre desde un Sheet lateral para no interrumpir el flujo de trabajo, consistente con Citas y otros módulos.
- El campo "Asignado a" muestra avatar + nombre del usuario, no solo el ID.
