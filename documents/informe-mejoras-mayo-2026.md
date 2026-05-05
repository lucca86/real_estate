# Informe de Mejoras — Mayo 2026

**Gestión Inmobiliaria RE — v1.0.0**

---

## 1. Optimización de imágenes

### El problema

Cada vez que se sincronizaba una propiedad con WordPress, el sistema volvía a subir **todas las imágenes** desde cero, sin importar si ya habían sido enviadas antes. Además, las imágenes se subían en su tamaño original — llegando a pesar hasta 325 KB a 1920×1080 píxeles — lo que generaba tiempos de carga lentos en el sitio y consumo innecesario de almacenamiento.

### Qué se mejoró

**Formato y tamaño:**
Las imágenes ahora se convierten automáticamente al formato **WebP** al momento de ser subidas. Este formato es más moderno que el JPEG tradicional y logra imágenes visualmente idénticas con un peso entre un 40% y un 65% menor. El tamaño máximo pasó de 1920×1080 a **1440×1080 píxeles**, suficiente para ver todos los detalles en pantalla completa.

Para WordPress se genera una versión dedicada de **1200×900 píxeles**, que es el tamaño ideal para galerías inmobiliarias web.

**Canvas fijo para todas las imágenes:**
Todas las imágenes — tanto horizontales como verticales — se procesan en un canvas de proporción fija 4:3. Las imágenes verticales se encajan dentro de ese canvas respetando sus proporciones originales y se rellenan los espacios laterales con fondo blanco. Esto garantiza que la galería se vea uniforme sin importar cómo fue tomada la foto.

**Evitar subidas repetidas:**
El sistema ahora recuerda el ID de cada imagen que ya fue enviada a WordPress. En la siguiente sincronización, verifica si esa imagen ya existe antes de volver a subirla. Si existe, la reutiliza directamente. Solo se sube de nuevo si la imagen fue eliminada del lado de WordPress.

### Resultado esperado

| | Antes | Después |
|---|---|---|
| Formato | JPEG | WebP |
| Tamaño máximo | 1920×1080 | 1440×1080 |
| Tamaño para WordPress | igual al original | 1200×900 dedicado |
| Re-subida en cada sync | Siempre | Solo si es necesario |
| Peso estimado por imagen | ~325 KB | ~100–120 KB |

---

## 2. Versionado de la aplicación

### El problema

No había forma visual de saber qué versión de la aplicación estaba corriendo, lo que dificultaba identificar si un cambio ya había sido desplegado o no.

### Qué se implementó

Se incorporó un sistema de versionado semántico (formato `v1.0.0`) que aparece de forma discreta en dos lugares:

- **En el encabezado principal**, junto al nombre "Gestión Inmobiliaria RE", como un pequeño badge gris.
- **En el menú lateral**, alineado al lado del logo.

La versión se define en un único lugar (`package.json`) y se propaga automáticamente a toda la aplicación en cada deploy. Para actualizar la versión en el futuro basta con cambiar ese número — no requiere tocar ningún componente visual.

---

## 3. Corrección de bugs

### Notas internas al editar una propiedad

Al editar una propiedad existente, el campo "Notas internas" aparecía siempre vacío, y al guardar, cualquier nota que hubiera sido guardada previamente se borraba.

El problema tenía dos partes: al cargar el formulario de edición, la nota no se trasladaba desde la base de datos al campo del formulario; y al guardar, el valor del campo tampoco se incluía en los datos enviados. Ambos puntos fueron corregidos.

### Error 500 en la página de configuración de WordPress

La página de ajustes de la integración con WordPress arrojaba un error genérico que impedía verla. La causa era que al intentar leer una configuración que todavía no existía en la base de datos, el sistema fallaba en lugar de simplemente devolver un valor vacío. Esto se corrigió para que la página cargue correctamente aun cuando no haya configuraciones guardadas.

### Error 404 al sincronizar propiedades con WordPress

Al sincronizar, WordPress devolvía un error 404 indicando que la ruta no existía. Esto ocurría principalmente porque la URL configurada no incluía el sufijo `/wp-json` que requiere la API de WordPress. El sistema ahora lo agrega automáticamente si no está presente, eliminando una fuente común de error de configuración.

### Error de hydration (pantallas en blanco intermitentes)

En algunas pantallas aparecían errores silenciosos relacionados con fechas. Esto ocurre cuando el servidor genera un texto (como "04/05/2026 18:30") y el navegador genera un texto diferente por usar una zona horaria o idioma distinto, y React detecta la diferencia como un error. Se creó un componente especial que evita este problema mostrando las fechas siempre desde el navegador, garantizando consistencia.

---

*Documento generado el 05/05/2026 — Gestión Inmobiliaria RE v1.0.0*
