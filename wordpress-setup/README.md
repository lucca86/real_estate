# Configuración de WordPress para Sincronización

Para que la sincronización de propiedades funcione correctamente con WordPress y el plugin Major Estatik, necesitas configurar WordPress para que acepte los campos personalizados vía REST API.

## Problema

Por defecto, WordPress REST API **NO permite** actualizar campos personalizados (meta fields) a menos que estén explícitamente registrados con `show_in_rest: true`. Esto significa que aunque el título y contenido se guardan correctamente, los campos personalizados como precio, ubicación, características, etc., no se guardan.

## Solución

Debes agregar código PHP a tu instalación de WordPress para registrar los meta fields de Estatik con la REST API.

### Opción 1: Agregar a functions.php (Recomendado para desarrollo)

1. Accede a tu WordPress
2. Ve a **Apariencia → Editor de temas**
3. Abre el archivo `functions.php` de tu tema activo
4. Copia y pega el contenido del archivo `register-estatik-meta-fields.php` al final del archivo
5. Guarda los cambios

### Opción 2: Crear un Plugin Personalizado (Recomendado para producción)

1. Crea una carpeta en `wp-content/plugins/` llamada `estatik-rest-api`
2. Dentro de esa carpeta, crea un archivo `estatik-rest-api.php` con este contenido:

```php
<?php
/**
 * Plugin Name: Estatik REST API Support
 * Description: Enables REST API support for Estatik meta fields
 * Version: 1.0
 * Author: Tu Nombre
 */

// Pega aquí el contenido de register-estatik-meta-fields.php
```

3. Activa el plugin desde **Plugins → Plugins instalados**

## Verificar que Funciona

Después de agregar el código:

1. Ve a la página de **Configuración** en tu aplicación
2. Haz clic en **"Probar Conexión"** para verificar que la conexión funciona
3. Intenta sincronizar una propiedad
4. Verifica en WordPress que todos los campos se hayan guardado correctamente

## Campos Soportados

Los siguientes campos se sincronizan automáticamente:

- **Información Básica:** Tipo de propiedad, tipo de transacción, estado
- **Precios:** Precio, moneda
- **Características:** Habitaciones, baños, área
- **Ubicación:** Dirección, ciudad, estado, país, coordenadas
- **Extras:** Características, amenidades, imágenes

## Troubleshooting

### Los campos aún no se guardan

1. Verifica que el código se haya agregado correctamente
2. Asegúrate de que el custom post type se llame exactamente `properties`
3. Si Major Estatik usa un nombre diferente para el post type, cámbialo en el código:
   ```php
   register_post_meta('properties', $field_name, [...]);
   // Cambia 'properties' por el nombre correcto
   ```

### ¿Cómo saber el nombre del post type?

1. Ve a WordPress → Propiedades
2. Mira la URL, debería ser algo como: `wp-admin/edit.php?post_type=properties`
3. El valor de `post_type` es el nombre que debes usar

### Los campos se guardan pero no se muestran en el front-end

Esto es normal. Los campos se están guardando en la base de datos de WordPress, pero Major Estatik necesita su propia configuración para mostrarlos. Consulta la documentación de Major Estatik para configurar cómo se muestran los campos en el front-end.

## Alternativa: Usar la API de Major Estatik

Si Major Estatik proporciona su propia REST API, puedes modificar el archivo `lib/wordpress.ts` para usar esos endpoints en lugar de los endpoints estándar de WordPress.

Consulta la documentación de Major Estatik para ver si tienen endpoints REST API personalizados.
