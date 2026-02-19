# Instrucciones para Modificar el Tema de WordPress

## Paso 1: Subir el Plugin Actualizado

Ya actualizaste el plugin PHP para guardar los campos de moneda. Asegúrate de que esté activo en WordPress.

## Paso 2: Agregar Funciones Personalizadas

Tienes **2 opciones** para agregar el código PHP:

### Opción A: Agregar al functions.php del tema (MÁS FÁCIL)

1. Ve a **Apariencia → Editor de temas** en WordPress
2. Busca el archivo `functions.php` de tu tema activo
3. **COPIA TODO el contenido** del archivo `functions-price-currency.php`
4. **PÉGALO AL FINAL** del archivo `functions.php` (después de todo el código existente)
5. Haz clic en **Actualizar archivo**

### Opción B: Crear un plugin personalizado (MÁS PROFESIONAL)

1. Crea una carpeta: `/wp-content/plugins/estatik-currency-display/`
2. Crea un archivo: `estatik-currency-display.php` con este contenido:

```php
<?php
/**
 * Plugin Name: Estatik Currency Display
 * Description: Muestra precios con moneda (USD/Pesos) en propiedades de Estatik
 * Version: 1.0
 * Author: Tu Nombre
 */

// PEGA AQUÍ todo el contenido de functions-price-currency.php
```

3. Ve a **Plugins → Plugins instalados** y activa el plugin

## Paso 3: Verificar que Funciona

### Prueba Rápida con Shortcode:

1. Ve a cualquier **Página o Post** en WordPress
2. Agrega este shortcode en el contenido:
   ```
   [property_price_with_currency id="PROPERTY_ID"]
   ```
   (Reemplaza `PROPERTY_ID` con el ID de una propiedad sincronizada)

3. Guarda y visualiza la página
4. Deberías ver: **"USD 100,000"** o **"Pesos 15,000,000"**

### Verificar en el Listado de Propiedades:

La **OPCIÓN 1** del código (filtro `es_property_price`) debería modificar automáticamente TODOS los precios en Estatik para mostrar la moneda.

1. Ve a tu página de listado de propiedades
2. Verifica si los precios ahora muestran la moneda
3. Si NO funciona, continúa al Paso 4

## Paso 4: Override de Templates (Si el filtro no funciona)

Si la OPCIÓN 1 no funciona automáticamente, necesitas override los templates de Estatik:

### 4.1 Identificar qué template usar:

- **Listado de propiedades**: `content-archive.php`
- **Página individual**: `single.php`
- **Widget de búsqueda**: Depende del widget específico

### 4.2 Copiar el template:

1. Ve a: `/wp-content/plugins/estatik/templates/front/property/`
2. Copia el archivo que quieres modificar (ej: `content-archive.php`)
3. Pégalo en: `/wp-content/themes/TU-TEMA/estatik4/front/property/`
   
   **IMPORTANTE:** Si usas un child theme, usa la ruta del child theme

### 4.3 Modificar el template:

1. Abre el archivo copiado
2. Busca donde se muestra el precio (generalmente `es_get_the_price()`)
3. Reemplázalo con:
   ```php
   <?php echo get_property_price_with_currency(get_the_ID()); ?>
   ```

### 4.4 Ejemplo visual:

**ANTES:**
```php
<div class="es-price">
    <?php echo es_get_the_price(); ?>
</div>
```

**DESPUÉS:**
```php
<div class="es-price">
    <?php 
    $price_with_currency = get_property_price_with_currency(get_the_ID());
    echo !empty($price_with_currency) ? esc_html($price_with_currency) : es_get_the_price();
    ?>
</div>
```

## Paso 5: Personalizar Estilos (Opcional)

Los estilos CSS ya están incluidos en el archivo `functions-price-currency.php` (OPCIÓN 5).

Si quieres personalizarlos más:

1. Ve a **Apariencia → Personalizar → CSS adicional**
2. Agrega tus estilos personalizados:

```css
/* Hacer los precios en USD más grandes y verdes */
.currency-badge-usd {
    background-color: #27ae60;
    font-size: 12px;
}

/* Hacer los precios en Pesos azules */
.currency-badge-ars {
    background-color: #3498db;
}

/* Estilo del precio completo */
.property-price-currency {
    font-size: 22px;
    font-weight: bold;
    color: #2c3e50;
}
```

## Solución de Problemas

### Problema: Los precios no muestran moneda

**Solución:**
1. Verifica que el plugin esté actualizado y activo
2. Sincroniza nuevamente una propiedad desde tu sistema
3. Ve a la propiedad en WordPress → Custom Fields
4. Verifica que existan estos campos:
   - `es_property_price_currency` (USD o ARS)
   - `es_property_price_formatted` (USD 100,000 o Pesos 15,000,000)

### Problema: El filtro no funciona

**Solución:**
El filtro `es_property_price` puede no existir en tu versión de Estatik.
En ese caso, DEBES usar override de templates (Paso 4).

### Problema: Los cambios no se ven

**Solución:**
1. Limpia la caché de WordPress (si usas plugin de caché)
2. Recarga la página con Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)
3. Verifica que el archivo functions.php se guardó correctamente

## ¿Qué Opción Usar?

| Situación | Opción Recomendada |
|-----------|-------------------|
| Solo quieres mostrar el precio con moneda en lugares específicos | **Shortcode** (OPCIÓN 2) |
| Quieres cambiar TODOS los precios automáticamente | **Filtro** (OPCIÓN 1) |
| Tienes acceso a modificar templates | **Override** (Paso 4) + **Función** (OPCIÓN 3) |
| Quieres agregar badges de moneda | **Badge** (OPCIÓN 4) |

## Contacto

Si tienes problemas, revisa:
1. Error log de WordPress: `/wp-content/debug.log`
2. Consola del navegador (F12) para errores JavaScript
3. Verifica que el plugin Estatik esté actualizado
