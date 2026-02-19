# Instrucciones para Arreglar Duplicación de DashboardLayout

## Problema
Todas las páginas en `app/(dashboard)/**/*` tienen el sidebar y header duplicados porque están envolviendo su contenido con `<DashboardLayout>` cuando `app/(dashboard)/layout.tsx` ya lo hace automáticamente.

## Solución
Para cada archivo en la lista siguiente, necesitas:

1. **Eliminar** el import: `import { DashboardLayout } from "@/components/dashboard-layout"`
2. **Eliminar** el import de `getCurrentUser` si solo se usa para pasar al DashboardLayout
3. **Eliminar** el wrapper `<DashboardLayout user={user}>...</DashboardLayout>`
4. **Mantener** solo el contenido interno (el JSX que estaba dentro de DashboardLayout)

## Archivos a Modificar

### Páginas de Lista
- `app/(dashboard)/appointments/page.tsx`
- `app/(dashboard)/clients/page.tsx`
- `app/(dashboard)/locations/page.tsx`
- `app/(dashboard)/owners/page.tsx`
- `app/(dashboard)/properties/page.tsx`
- `app/(dashboard)/property-types/page.tsx`
- `app/(dashboard)/users/page.tsx`
- `app/(dashboard)/catalog/page.tsx`
- `app/(dashboard)/settings/page.tsx`

### Páginas de Creación (new)
- `app/(dashboard)/appointments/new/page.tsx`
- `app/(dashboard)/clients/new/page.tsx`
- `app/(dashboard)/locations/cities/new/page.tsx`
- `app/(dashboard)/locations/countries/new/page.tsx`
- `app/(dashboard)/locations/neighborhoods/new/page.tsx`
- `app/(dashboard)/locations/provinces/new/page.tsx`
- `app/(dashboard)/owners/new/page.tsx`
- `app/(dashboard)/properties/new/page.tsx`
- `app/(dashboard)/property-types/new/page.tsx`
- `app/(dashboard)/users/new/page.tsx`

### Páginas de Edición ([id]/edit)
- `app/(dashboard)/appointments/[id]/edit/page.tsx`
- `app/(dashboard)/clients/[id]/edit/page.tsx`
- `app/(dashboard)/locations/cities/[id]/edit/page.tsx`
- `app/(dashboard)/locations/countries/[id]/edit/page.tsx`
- `app/(dashboard)/locations/neighborhoods/[id]/edit/page.tsx`
- `app/(dashboard)/locations/provinces/[id]/edit/page.tsx`
- `app/(dashboard)/owners/[id]/edit/page.tsx`
- `app/(dashboard)/properties/[id]/edit/page.tsx`
- `app/(dashboard)/property-types/[id]/edit/page.tsx`
- `app/(dashboard)/users/[id]/edit/page.tsx`

### Páginas de Detalle
- `app/(dashboard)/properties/[id]/page.tsx`
- `app/(dashboard)/catalog/[id]/page.tsx`

## Ejemplo de Transformación

**ANTES:**
```typescript
import { getCurrentUser } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function SomePage() {
  const user = await getCurrentUser()
  
  return (
    <DashboardLayout user={user}>
      <div>
        <h1>Contenido de la página</h1>
      </div>
    </DashboardLayout>
  )
}
```

**DESPUÉS:**
```typescript
export default async function SomePage() {
  return (
    <div>
      <h1>Contenido de la página</h1>
    </div>
  )
}
```

## Nota Importante
NO modifiques `app/(dashboard)/layout.tsx` - ese archivo DEBE mantener el DashboardLayout porque es el que lo aplica a todas las páginas hijas.
