# Plan de Migración: Vercel Blob → Cloudflare Images

## Resumen Ejecutivo

Este documento detalla el plan para migrar el almacenamiento de imágenes desde Vercel Blob Storage a Cloudflare Images, con el objetivo de reducir costos y mejorar el rendimiento de las imágenes.

---

## 1. Análisis de la Situación Actual

### 1.1 Implementación Actual con Vercel Blob

**Archivos que utilizan Vercel Blob:**
- `app/api/upload-property-image/route.ts` - Subida de imágenes de propiedades con optimización
- `lib/actions/users.ts` - Subida de avatares de usuario

**Funcionalidades implementadas:**
- ✅ Subida de imágenes de propiedades con 3 tamaños (thumbnail, medium, large)
- ✅ Optimización con Sharp (compresión JPEG progresiva)
- ✅ Detección automática de orientación (vertical/horizontal)
- ✅ Diferentes aspect ratios según orientación
- ✅ Subida de avatares de usuario
- ✅ Token de autenticación (`BLOB_READ_WRITE_TOKEN`)

**Costos actuales:**
- Vercel Blob cobra por almacenamiento y transferencia de datos
- Cada imagen se almacena en 3 versiones diferentes

---

## 2. Ventajas de Cloudflare Images

### 2.1 Características de Cloudflare Images

**Optimización automática:**
- ✅ Redimensionamiento on-demand mediante variantes
- ✅ Conversión automática de formato (WebP, AVIF)
- ✅ Compresión inteligente
- ✅ Servido desde CDN global de Cloudflare

**Variantes (en lugar de múltiples archivos):**
- Una imagen original → múltiples variantes generadas automáticamente
- No necesitas subir 3 versiones diferentes
- Las variantes se generan y cachean on-demand

**Límites técnicos:**
- Máximo 10 MB por imagen
- Dimensiones máximas: 12,000 px
- Área máxima: 100 megapíxeles
- Formatos soportados: PNG, JPEG, GIF, WebP, SVG, HEIC

**Ventajas de costos:**
- Precio más competitivo que Blob
- Incluye CDN sin costo adicional
- No pagas por cada variante (se generan on-the-fly)

---

## 3. Arquitectura de la Solución

### 3.1 Flujo de Subida de Imágenes

\`\`\`
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. Upload File
       ↓
┌──────────────────────┐
│  API Route Handler   │
│ /api/upload-property │
└──────┬───────────────┘
       │
       │ 2. Optimizar con Sharp (opcional)
       │    - Reducir tamaño si es muy grande
       │    - Comprimir para reducir payload
       ↓
┌──────────────────────┐
│  Cloudflare Images   │
│       API            │
└──────┬───────────────┘
       │
       │ 3. Retorna image_id y URL
       ↓
┌──────────────────────┐
│  Guardar en DB       │
│  (image_id + URL)    │
└──────────────────────┘
\`\`\`

### 3.2 Flujo de Servido de Imágenes

\`\`\`
Usuario solicita imagen
         ↓
https://imagedelivery.net/{account_hash}/{image_id}/{variant}
         ↓
Cloudflare CDN verifica cache
         ↓
Si no está en cache → Genera variante → Cachea → Sirve
Si está en cache → Sirve directamente
\`\`\`

---

## 4. Plan de Implementación

### Fase 1: Configuración Inicial (1-2 horas)

**4.1. Crear cuenta y obtener credenciales**
- [ ] Registrarse en Cloudflare Images
- [ ] Obtener `CLOUDFLARE_ACCOUNT_ID`
- [ ] Generar `CLOUDFLARE_IMAGES_API_TOKEN`
- [ ] Anotar el `account_hash` para URLs de delivery

**4.2. Configurar variantes en Cloudflare**
- [ ] Crear variante `thumbnail`: 400x300 (horizontal) / 300x400 (vertical)
- [ ] Crear variante `medium`: 800x600 (horizontal) / 600x800 (vertical)
- [ ] Crear variante `large`: 1920x1080 (horizontal) / 1080x1920 (vertical)
- [ ] Crear variante `avatar`: 150x150 (cuadrado)

**Configuración de variantes:**
\`\`\`json
{
  "thumbnail": {
    "fit": "cover",
    "width": 400,
    "height": 300
  },
  "medium": {
    "fit": "cover",
    "width": 800,
    "height": 600
  },
  "large": {
    "fit": "cover",
    "width": 1920,
    "height": 1080
  },
  "avatar": {
    "fit": "cover",
    "width": 150,
    "height": 150
  }
}
\`\`\`

**4.3. Agregar variables de entorno**
\`\`\`env
CLOUDFLARE_ACCOUNT_ID=tu_account_id
CLOUDFLARE_IMAGES_API_TOKEN=tu_api_token
CLOUDFLARE_IMAGES_ACCOUNT_HASH=tu_hash
\`\`\`

---

### Fase 2: Implementación del Código (2-3 horas)

**4.4. Crear utilidad de Cloudflare Images**

Crear archivo: `lib/cloudflare-images.ts`

\`\`\`typescript
interface CloudflareImageUploadResponse {
  success: boolean
  result: {
    id: string
    filename: string
    uploaded: string
    requireSignedURLs: boolean
    variants: string[]
  }
  errors: any[]
}

export async function uploadToCloudflareImages(
  file: File | Buffer,
  filename?: string
): Promise<{ id: string; url: string }> {
  const formData = new FormData()
  
  if (file instanceof File) {
    formData.append('file', file)
  } else {
    const blob = new Blob([file])
    formData.append('file', blob, filename || 'image.jpg')
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
      body: formData,
    }
  )

  const data: CloudflareImageUploadResponse = await response.json()

  if (!data.success) {
    throw new Error(`Cloudflare Images upload failed: ${JSON.stringify(data.errors)}`)
  }

  const imageUrl = `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${data.result.id}`

  return {
    id: data.result.id,
    url: imageUrl,
  }
}

export async function deleteFromCloudflareImages(imageId: string): Promise<boolean> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
    }
  )

  const data = await response.json()
  return data.success
}

export function getCloudflareImageUrl(imageId: string, variant: string = 'public'): string {
  return `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${imageId}/${variant}`
}
\`\`\`

**4.5. Actualizar API de subida de propiedades**

Modificar: `app/api/upload-property-image/route.ts`

\`\`\`typescript
import { uploadToCloudflareImages, getCloudflareImageUrl } from '@/lib/cloudflare-images'
import sharp from 'sharp'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Optimizar imagen antes de subir (reducir tamaño si es muy grande)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const metadata = await sharp(buffer).metadata()
    
    // Si la imagen es muy grande, reducirla antes de subir
    let optimizedBuffer = buffer
    if (metadata.width && metadata.width > 3000) {
      optimizedBuffer = await sharp(buffer)
        .resize(3000, null, { withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true })
        .toBuffer()
    }

    // Subir a Cloudflare Images (solo una vez)
    const { id: imageId, url: baseUrl } = await uploadToCloudflareImages(
      optimizedBuffer,
      file.name
    )

    // Construir URLs para diferentes variantes
    const result = {
      url: getCloudflareImageUrl(imageId, 'large'), // URL principal
      imageId, // Guardar para poder eliminar después
      sizes: {
        thumbnail: {
          url: getCloudflareImageUrl(imageId, 'thumbnail'),
          width: 400,
          height: 300,
        },
        medium: {
          url: getCloudflareImageUrl(imageId, 'medium'),
          width: 800,
          height: 600,
        },
        large: {
          url: getCloudflareImageUrl(imageId, 'large'),
          width: 1920,
          height: 1080,
        },
      },
      originalName: file.name,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[v0] Cloudflare Images upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
\`\`\`

**4.6. Actualizar acciones de usuarios**

Modificar: `lib/actions/users.ts`

\`\`\`typescript
import { uploadToCloudflareImages, getCloudflareImageUrl } from '@/lib/cloudflare-images'

// En createUser:
if (avatarFile && avatarFile.size > 0) {
  const { id: imageId } = await uploadToCloudflareImages(avatarFile)
  avatarUrl = getCloudflareImageUrl(imageId, 'avatar')
}

// En updateUser:
if (avatarFile && avatarFile.size > 0) {
  const { id: imageId } = await uploadToCloudflareImages(avatarFile)
  avatarUrl = getCloudflareImageUrl(imageId, 'avatar')
}
\`\`\`

---

### Fase 3: Actualización de la Base de Datos (1 hora)

**4.7. Migrar esquema de imágenes**

Actualmente las propiedades guardan URLs de Blob. Necesitamos:
- Mantener compatibilidad con URLs antiguas
- Agregar campo opcional `cloudflare_image_id` para imágenes nuevas

\`\`\`sql
-- Agregar columna para Cloudflare Image ID
ALTER TABLE properties 
ADD COLUMN cloudflare_image_ids JSONB;

-- Estructura sugerida:
-- {
--   "thumbnail": "image_id_1",
--   "medium": "image_id_2",
--   "large": "image_id_3"
-- }
-- O más simple si usamos variantes:
-- "main_image_id"
\`\`\`

**4.8. Script de migración de datos**

Crear: `scripts/migrate-images-to-cloudflare.ts`

\`\`\`typescript
// Este script:
// 1. Lee todas las propiedades con imágenes en Blob
// 2. Descarga cada imagen de Blob
// 3. Sube a Cloudflare Images
// 4. Actualiza la base de datos con el nuevo image_id
// 5. (Opcional) Elimina la imagen de Blob

// NOTA: Ejecutar con precaución, hacer backup antes
\`\`\`

---

### Fase 4: Testing (2 horas)

**4.9. Tests a realizar**

- [ ] Subir imagen de propiedad nueva
- [ ] Verificar que se genera correctamente el `image_id`
- [ ] Comprobar que las 3 variantes (thumbnail, medium, large) cargan correctamente
- [ ] Subir avatar de usuario
- [ ] Verificar redimensionamiento automático
- [ ] Comprobar carga desde diferentes ubicaciones geográficas
- [ ] Verificar performance en Lighthouse
- [ ] Probar eliminación de imágenes

**4.10. Rollback plan**

Si algo falla:
1. Cambiar variable de entorno para volver a Blob
2. Mantener código compatible con ambos sistemas temporalmente
3. Usar feature flag para controlar qué sistema usar

\`\`\`typescript
const USE_CLOUDFLARE_IMAGES = process.env.NEXT_PUBLIC_USE_CLOUDFLARE_IMAGES === 'true'

if (USE_CLOUDFLARE_IMAGES) {
  // Lógica de Cloudflare Images
} else {
  // Lógica de Blob (legacy)
}
\`\`\`

---

### Fase 5: Migración de Imágenes Existentes (Tiempo variable)

**4.11. Estrategia de migración**

**Opción A: Migración total (recomendada si hay pocas imágenes)**
- Ejecutar script de migración para todas las imágenes
- Tiempo estimado: depende del número de imágenes

**Opción B: Migración progresiva (para muchas imágenes)**
- Las imágenes nuevas van a Cloudflare
- Las imágenes antiguas permanecen en Blob
- Código detecta qué sistema usar según el formato de URL
- Migrar gradualmente en background

**Opción C: Migración lazy (bajo demanda)**
- Cuando se accede a una imagen de Blob
- Si no existe en Cloudflare, migrarla automáticamente
- Cachear el resultado

---

### Fase 6: Optimizaciones Adicionales (Opcional)

**4.12. Mejoras adicionales**

- [ ] Implementar lazy loading de imágenes
- [ ] Usar `<picture>` con múltiples formatos (WebP, AVIF)
- [ ] Implementar blur placeholder
- [ ] Agregar metadata de imágenes (alt text automático con AI)
- [ ] Implementar image compression quality settings por variante
- [ ] Configurar purge de cache cuando se actualice una imagen

**Ejemplo de uso avanzado:**

\`\`\`tsx
<picture>
  <source
    srcSet={`${imageUrl}/webp`}
    type="image/webp"
  />
  <source
    srcSet={`${imageUrl}/avif`}
    type="image/avif"
  />
  <img
    src={`${imageUrl}/public`}
    alt={property.title}
    loading="lazy"
  />
</picture>
\`\`\`

---

## 5. Estimación de Costos

### Vercel Blob (actual)
- Almacenamiento: $X/GB/mes
- Transferencia: $X/GB
- Cada imagen = 3 archivos almacenados

### Cloudflare Images (proyectado)
- Precio competitivo por almacenamiento
- CDN incluido
- 1 imagen original + variantes on-demand
- Sin costo por transferencia CDN

**Ahorro estimado:** 40-60% dependiendo del volumen

---

## 6. Timeline

| Fase | Duración | Responsable | Estado |
|------|----------|-------------|--------|
| 1. Configuración inicial | 1-2 horas | Dev | ⏳ Pendiente |
| 2. Implementación código | 2-3 horas | Dev | ⏳ Pendiente |
| 3. Actualización DB | 1 hora | Dev | ⏳ Pendiente |
| 4. Testing | 2 horas | QA/Dev | ⏳ Pendiente |
| 5. Migración imágenes | Variable | Dev | ⏳ Pendiente |
| 6. Optimizaciones | Opcional | Dev | ⏳ Pendiente |

**Total estimado:** 6-8 horas (sin contar migración de imágenes existentes)

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de imágenes durante migración | Media | Alto | Backup completo antes de migrar |
| URLs rotas en producción | Baja | Alto | Mantener compatibilidad dual, feature flag |
| Límites de API excedidos | Baja | Medio | Rate limiting en migración, procesar por lotes |
| Calidad de imagen diferente | Media | Bajo | Ajustar configuración de variantes |
| Costos inesperados | Baja | Medio | Monitorear uso durante primeras semanas |

---

## 8. Checklist de Go-Live

**Pre-deployment:**
- [ ] Backup completo de base de datos
- [ ] Backup de todas las imágenes actuales
- [ ] Variables de entorno configuradas en producción
- [ ] Variantes creadas en Cloudflare Images
- [ ] Tests pasando al 100%
- [ ] Documentación actualizada

**Deployment:**
- [ ] Deploy de nuevo código
- [ ] Verificar que imágenes nuevas funcionan
- [ ] Monitorear logs de errores
- [ ] Verificar performance

**Post-deployment:**
- [ ] Ejecutar migración de imágenes existentes
- [ ] Verificar integridad de todas las imágenes migradas
- [ ] Monitorear costos de Cloudflare
- [ ] (Opcional) Eliminar imágenes de Blob después de X días

---

## 9. Documentación Adicional

### Enlaces útiles:
- [Cloudflare Images Docs](https://developers.cloudflare.com/images/)
- [Cloudflare Images API](https://developers.cloudflare.com/api/resources/images/)
- [Cloudflare Images Pricing](https://www.cloudflare.com/products/cloudflare-images/)

### Contactos:
- Soporte Cloudflare: [support@cloudflare.com](mailto:support@cloudflare.com)
- Documentación interna: `/docs/CLOUDFLARE_IMAGES_MIGRATION_PLAN.md`

---

## 10. Conclusión

La migración a Cloudflare Images proporcionará:
- ✅ Reducción de costos (40-60%)
- ✅ Mejor rendimiento (CDN global)
- ✅ Optimización automática de imágenes
- ✅ Menor complejidad (variantes vs múltiples archivos)
- ✅ Mejor escalabilidad

**Recomendación:** Proceder con la migración siguiendo este plan paso a paso, comenzando con un entorno de prueba antes de producción.
