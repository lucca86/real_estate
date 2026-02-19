# Instrucciones para Mostrar Moneda en WordPress

## Problema Resuelto
Las propiedades ahora se sincronizan con los campos `es_property_price_currency` (USD/ARS) y `es_property_price_formatted`, pero WordPress/Estatik no los muestra automáticamente.

## Solución Implementada
Se proporcionan **3 métodos** para mostrar la moneda. Elige el que mejor se adapte a tu setup:

---

## MÉTODO 1: Script JavaScript Automático (RECOMENDADO)

### Ventajas
✅ No modifica archivos del tema directamente
✅ Funciona con cualquier tema de Estatik
✅ Se actualiza automáticamente con AJAX
✅ Fácil de desinstalar

### Instalación

1. **Copiar el archivo JavaScript:**
   ```bash
   wp-content/themes/tu-tema/js/currency-display.js
   ```

2. **Agregar al `functions.php` de tu tema:**
   ```php
   function enqueue_currency_display_script() {
       wp_enqueue_script(
           'estatik-currency-display',
           get_stylesheet_directory_uri() . '/js/currency-display.js',
           array('jquery'),
           '1.0.0',
           true
       );
   }
   add_action('wp_enqueue_scripts', 'enqueue_currency_display_script');
   ```

3. **Listo!** El script detectará automáticamente todos los precios y agregará badges de USD/ARS.

---

## MÉTODO 2: Filtros PHP de WordPress

### Ventajas
✅ Integración nativa con WordPress
✅ Mejor rendimiento
✅ SEO optimizado

### Instalación

Agregar TODOS los códigos del archivo `enqueue-currency-script.php` al `functions.php`:

```php
// Copiar todo el contenido de enqueue-currency-script.php
```

---

## MÉTODO 3: Shortcode Manual

### Ventajas
✅ Control total sobre dónde aparece
✅ Ideal para templates personalizados

### Uso

En cualquier template de WordPress:

```php
<?php echo do_shortcode('[property_price_currency]'); ?>
```

O en el editor de bloques:
```
[property_price_currency]
```

---

## Verificación

### 1. Verificar que los campos se guardaron
Ir a una propiedad en WordPress → Custom Fields → Buscar:
- `es_property_price_currency`: USD o ARS
- `es_property_price_formatted`: USD 100,000 o Pesos 15,000,000

### 2. Si NO aparecen los campos
El plugin PHP no está guardando los campos. Verificar:
```bash
wordpress-setup/estatik-rest-api-bridge/estatik-rest-api-bridge.php
```

Buscar en la línea ~280 que esté:
```php
case 'es_property_price_currency':
case 'es_property_price_formatted':
    update_post_meta($post_id, $key, sanitize_text_field($value));
    break;
```

### 3. Si los campos están pero no se muestran
Aplicar MÉTODO 1 (JavaScript) que funciona en todos los casos.

---

## Resultado Visual

Los precios se mostrarán así:

- **USD**: `[USD] $100,000` (badge verde)
- **ARS**: `[ARS] $15,000,000` (badge naranja)

---

## Troubleshooting

### El script no se carga
```bash
# Verificar que el archivo existe:
wp-content/themes/tu-tema/js/currency-display.js

# Verificar en el navegador (F12 → Network → JS) que se cargó
```

### Los badges no aparecen
```javascript
// Abrir consola del navegador (F12) y ejecutar:
document.querySelectorAll('.es-property__price')

// Debe mostrar los elementos de precio
// Si es [0], el selector está mal. Inspeccionar el HTML y ajustar en currency-display.js línea 54
```

### Conflicto con otros plugins
```php
// En functions.php, cambiar la prioridad:
add_action('wp_enqueue_scripts', 'enqueue_currency_display_script', 999);
```

---

## Próximos Pasos

1. ✅ Subir archivo `currency-display.js` a tu tema
2. ✅ Agregar código al `functions.php`
3. ✅ Sincronizar una propiedad desde tu app
4. ✅ Verificar en WordPress que se vea el badge de moneda
