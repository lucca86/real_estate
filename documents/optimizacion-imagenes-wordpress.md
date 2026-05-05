# Plan de Optimización de Imágenes — Sincronización con WordPress

**Fecha:** Mayo 2026  
**Proyecto:** Real Estate CRM  
**Autor:** Análisis técnico v0

---

## 1. Estado Actual — Diagnóstico

### Pipeline de imágenes hoy

```
Usuario sube archivo
       ↓
/api/upload-property-image (Sharp)
  - Genera 3 tamaños: thumbnail (400×300), medium (800×600), large (1920×1080)
  - Formato: JPEG, calidad 70/80/85
  - Sube las 3 versiones a Vercel Blob
       ↓
Supabase guarda JSON con { url, sizes: { thumbnail, medium, large } }
       ↓
Al sincronizar con WordPress:
  wordpressAPI.syncProperty() → loop de imágenes
    → uploadImage(imageUrl, filename)
      → fetch(imageUrl)        ← descarga la imagen ENTERA desde Blob
      → WordPress /wp/v2/media ← sube la imagen ENTERA a WordPress
```

### Problemas identificados

| Problema | Impacto |
|---|---|
| **Siempre re-sube TODAS las imágenes en cada sincronización** | Redundante, lento, consume ancho de banda doble |
| **Sube la versión `large` (1920×1080)** | 325KB por imagen, innecesario para web |
| **Sin cache de IDs de WordPress por imagen** | No hay forma de saber si la imagen ya existe en WP Media Library |
| **Sin hash/fingerprint por imagen** | No se puede detectar si la imagen cambió |
| **Nombre de archivo genérico**: `property-{id}-{Date.now()}-{i}.jpg` | Crea duplicados en cada sync |
| **JPEG para todas las imágenes** | WebP es un 25–35% más liviano con igual calidad visual |
| **`console.log` activos en producción** en upload route | Performance y seguridad |

---

## 2. Análisis de Formatos: JPEG vs WebP vs AVIF

### Comparación técnica

| Característica | JPEG | WebP | AVIF |
|---|---|---|---|
| Compresión | Baseline | ~25–35% mejor que JPEG | ~50% mejor que JPEG |
| Soporte navegadores | Universal (100%) | 97%+ (todos modernos) | 87%+ (faltan Safari iOS <16) |
| Soporte WordPress | Nativo desde siempre | **Nativo desde WP 5.8+** | WP 6.5+ (parcial) |
| Calidad visual | Buena | Igual o mejor que JPEG | Excelente |
| Velocidad de codificación | Rápida | Rápida (libwebp) | Lenta (codificador CPU intensivo) |
| Sharp soporte | Nativo | Nativo | Nativo |
| Vercel Blob soporte | Si | Si | Si |

### Conclusión de formato

**WebP es la mejor opción** para este proyecto:
- Sharp (ya instalado) lo genera nativamente con `sharp().webp()`
- WordPress lo acepta de forma nativa desde la versión 5.8
- No requiere ninguna librería adicional
- Ahorra 25–35% de peso con la misma calidad visual percibida
- Soporte de navegadores es prácticamente universal

No se necesita ninguna herramienta adicional: **Sharp ya hace todo**.

---

## 3. Dimensiones Óptimas para Inmobiliaria

El objetivo es mostrar detalles de una propiedad: habitaciones, baños, fachada, jardín.

| Tamaño | Uso | Dimensiones | Calidad WebP | Uso estimado |
|---|---|---|---|---|
| `thumbnail` | Grillas, listados, cards | 480×360 | 75 | ~25–40KB |
| `medium` | Galería interna, vista principal | 1024×768 | 82 | ~80–120KB |
| `large` | Pantalla completa, lightbox | 1440×1080 | 85 | ~150–220KB |
| `wordpress` | **Solo para WP sync** | 1200×900 | 80 | ~100–160KB |

La resolución 1200×900 para WordPress es suficiente para:
- Ver detalles de habitaciones con claridad
- Slider de propiedades en pantallas Full HD
- Thumbnails del plugin Estatik (no necesita más de 1024px)

Actualmente se sube 1920×1080 (325KB) — con este plan sería 1200×900 WebP (~120KB).  
**Ahorro estimado: 60–65% por imagen.**

---

## 4. Solución al Problema de Re-Subida Siempre

### Causa raíz

El objeto `PropertyImage` en Supabase ya almacena `sizes.thumbnail`, `sizes.medium`, `sizes.large` **pero no almacena el `wordpress_media_id`**. Sin ese ID, cada sincronización sube desde cero.

### Solución: Agregar `wordpressMediaId` al objeto de imagen

```typescript
interface PropertyImage {
  id: string
  url: string
  sizes: {
    thumbnail: string
    medium: string
    large: string
    wordpress?: string  // ← nueva: URL de la versión específica para WP
  }
  wordpressMediaId?: number  // ← nuevo: ID del media en WP, evita re-subir
  isCover: boolean
  syncToWordPress: boolean
  originalName: string
  checksum?: string  // ← nuevo: hash MD5/SHA256 para detectar cambios
}
```

### Lógica de sync inteligente

```
Para cada imagen a sincronizar:
  SI la imagen ya tiene wordpressMediaId > 0:
    → Verificar que el media exista en WP (GET /wp/v2/media/{id})
    → SI existe: usar el ID directamente (sin subir nada)
    → SI no existe: subir y actualizar wordpressMediaId
  SINO:
    → Subir la versión `wordpress` (1200×900 WebP)
    → Guardar el mediaId devuelto en el objeto de imagen
    → Actualizar Supabase con el nuevo wordpressMediaId
```

Con esto, una propiedad con 8 imágenes que ya fue sincronizada **no sube ninguna imagen** en la segunda sincronización.

---

## 5. Plan de Implementación

### Fase 1 — Cambiar formato a WebP en upload (inmediato, sin breaking changes)

**Archivo:** `app/api/upload-property-image/route.ts`

Cambios:
- Reemplazar `.jpeg({ quality })` por `.webp({ quality })`
- Cambiar extensión de archivos `.jpg` → `.webp`
- Ajustar dimensiones de `large` de 1920×1080 → 1440×1080
- Agregar tamaño `wordpress: 1200×900` al objeto de salida
- Remover `console.log` de producción

```typescript
// Antes
const optimizedBuffer = await sharp(buffer)
  .resize(dimensions.width, dimensions.height, { fit: "cover" })
  .jpeg({ quality: 85, progressive: true })
  .toBuffer()

// Después
const optimizedBuffer = await sharp(buffer)
  .resize(dimensions.width, dimensions.height, { fit: "cover", position: "centre" })
  .webp({ quality: 82, effort: 4 })  // effort 4 = buen balance velocidad/compresión
  .toBuffer()
```

**Impacto:** Las imágenes nuevas se guardarán como WebP. Las existentes en JPEG siguen funcionando.

---

### Fase 2 — Sync inteligente con caché de Media IDs (requiere migración de schema)

**Archivos a modificar:**
- `lib/wordpress.ts` → método `syncProperty()` y `uploadImage()`
- `lib/actions/wordpress.ts` → `syncPropertyToWordPress()`
- `lib/image-utils.ts` → tipo `PropertyImage`

**Lógica en `uploadImage()`:**

```typescript
async uploadImage(
  imageUrl: string, 
  filename: string,
  existingWordpressId?: number
): Promise<number | undefined> {
  
  // Si ya existe un media ID, verificarlo antes de re-subir
  if (existingWordpressId) {
    try {
      await this.request(`/wp/v2/media/${existingWordpressId}`)
      return existingWordpressId  // Ya existe, reutilizar
    } catch {
      // No existe, continuar con la subida
    }
  }

  // Preferir la versión 'wordpress' (1200×900) si existe en el objeto
  // ... resto de la lógica de upload
}
```

**Lógica en `syncProperty()`:**

```typescript
// En el loop de imágenes:
for (const imageObj of imagesToSync) {
  const existingMediaId = imageObj.wordpressMediaId
  const wpUrl = imageObj.sizes?.wordpress || imageObj.url

  const imageId = await this.uploadImage(wpUrl, filename, existingMediaId)
  
  if (imageId && imageId !== existingMediaId) {
    // Actualizar el ID en el objeto para persistir luego
    imageObj.wordpressMediaId = imageId
    imagesUpdated = true
  }
}

// Después del sync, si hubo cambios de IDs, actualizar Supabase
if (imagesUpdated) {
  await supabase.from("properties")
    .update({ images: updatedImages })
    .eq("id", propertyId)
}
```

---

### Fase 3 — Generación de versión específica para WordPress (opcional, mejora futura)

En lugar de descargar la versión `large` existente y subirla a WordPress, generar desde el inicio una versión `wordpress` optimizada al momento del upload. Esto requiere:

1. Agregar un 4to tamaño en el upload route: `wordpress: { width: 1200, height: 900 }`
2. Guardarlo en `sizes.wordpress` en el JSON de Supabase
3. En el sync, usar `imageObj.sizes.wordpress || imageObj.url`

---

## 6. Herramientas Necesarias

| Herramienta | Estado | Uso |
|---|---|---|
| **Sharp** | Ya instalado | Resize + conversión WebP/JPEG |
| **Vercel Blob** | Ya configurado | Almacenamiento de imágenes |
| **WordPress REST API** | Ya conectado | Upload a Media Library |

**No se necesita ninguna herramienta adicional.** Sharp soporta WebP, AVIF, JPEG, PNG y GIF de forma nativa.

---

## 7. Estimación de Mejoras

| Métrica | Antes | Después (Fase 1) | Después (Fase 1+2) |
|---|---|---|---|
| Peso imagen principal | 325KB (JPEG 1920×1080) | ~140KB (WebP 1440×1080) | ~110KB (WebP 1200×900) |
| Imágenes re-subidas por sync | Todas (100%) | Todas (100%) | Solo las nuevas/cambiadas |
| Tiempo de sync (8 imágenes) | ~40s | ~30s | ~3s (si no cambiaron) |
| Ancho de banda por sync | ~2.6MB | ~1.1MB | ~0MB (si no cambiaron) |
| Capacidad Blob consumida | 3 versiones JPEG | 3 versiones WebP (35% menos) | 4 versiones WebP |

---

## 8. Orden de Prioridad

1. **Inmediato (Fase 1):** Cambiar JPEG → WebP en el upload route. Sin breaking changes, sin migración de datos. Las imágenes existentes siguen funcionando.

2. **Corto plazo (Fase 2):** Implementar caché de `wordpressMediaId` en el objeto de imagen. Requiere que las imágenes se re-sincronicen una vez para poblar los IDs.

3. **Opcional (Fase 3):** Generar y almacenar la versión `wordpress` de 1200×900 en el momento del upload original.

---

## 9. Notas Técnicas

- **WebP en WordPress:** WordPress soporta WebP de forma nativa desde la versión 5.8 (2021). El plugin Estatik no tiene restricciones de formato documentadas.
- **Sharp `effort`:** El parámetro `effort` en WebP va de 0 (rápido, peor compresión) a 6 (lento, mejor compresión). El valor 4 es el mejor balance para producción en Vercel serverless.
- **Imágenes existentes:** No es necesario re-procesar las imágenes ya subidas en JPEG. El sistema soporta ambos formatos simultáneamente ya que la URL se almacena tal cual en Supabase.
- **`progressive: true` en JPEG:** Ya estaba configurado, es una buena práctica para carga progresiva.
- **Vercel Blob:** Soporta WebP de forma nativa como `Content-Type: image/webp`.
