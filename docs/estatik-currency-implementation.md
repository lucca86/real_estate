# Implementación de Monedas en Estatik

## Problema Resuelto

Estatik solo soporta UNA moneda global, pero nuestra aplicación maneja propiedades en múltiples monedas (USD, ARS).

## Solución Implementada

### 1. Mapeo de Monedas

En `lib/wordpress.ts`:
- **USD** → `es_property_price_currency = "USD"` - Se muestra como "Dólares"
- **ARS** → `es_property_price_currency = "ARS"` - Se muestra como "Pesos"

### 2. Campos Enviados a WordPress

Para cada propiedad se envían 3 campos:

1. **`es_property_price`** (numérico)
   - Ejemplo: `150000`
   - Campo estándar de Estatik

2. **`es_property_price_currency`** (string)
   - Ejemplo: `USD` o `ARS`
   - Campo estándar de Estatik (aunque no siempre usado)

3. **`es_property_price_formatted`** (string) - NUEVO
   - Ejemplo: `USD 150,000` o `Pesos 50.000.000`
   - Campo personalizado que incluye el símbolo y formato correcto

### 3. Configuración de Estatik en WordPress

#### Opción A: Configurar USD como Moneda Global (RECOMENDADO)

Ya que tienes 65 propiedades en USD vs 4 en pesos:

1. Ir a **Estatik > Data Manager > Units & Formats**
2. En "Código de moneda" seleccionar: **USD - US Dollar**
3. En "Firmar" poner: **$**
4. Guardar cambios

#### Opción B: Configurar ARS como Moneda Global

Si prefieres mostrar pesos argentinos:

1. Mantener la configuración actual (ARS - Argentine Peso)
2. Las propiedades en USD mostrarán el precio usando el campo `es_property_price_formatted`

### 4. Uso del Campo Formateado en el Tema

Para mostrar el precio con el símbolo correcto en el frontend de WordPress, usar:

\`\`\`php
<?php 
// En place de usar es_the_price(), usar el campo formateado:
$formatted_price = get_post_meta(get_the_ID(), 'es_property_price_formatted', true);
if ($formatted_price) {
    echo $formatted_price; // Muestra "USD 150,000" o "Pesos 50.000.000"
} else {
    es_the_price(); // Fallback al precio estándar
}
?>
\`\`\`

O con shortcode:
\`\`\`
[es_property_field name="es_property_price_formatted"]
\`\`\`

### 5. Estadísticas de Monedas

Según la base de datos:
- **USD**: 65 propiedades (Dólares) - 94%
- **ARS**: 4 propiedades (Pesos) - 6%

**Nota:** DOP (Pesos Dominicanos) fue eliminado del sistema y ya no está disponible como opción.

### 6. Logs de Debug

El sistema ahora registra en consola:
\`\`\`
[v0] Added currency: {
  original: 'USD',
  mapped: 'USD',
  formatted: 'USD 150,000'
}
\`\`\`

o

\`\`\`
[v0] Added currency: {
  original: 'ARS',
  mapped: 'ARS',
  formatted: 'Pesos 50.000.000'
}
\`\`\`

Esto permite verificar que las monedas se están mapeando correctamente.

### 7. Próximos Pasos (Opcional)

Si quieres que el tema use automáticamente el campo formateado:

1. **Editar el archivo del tema** (child theme recomendado)
2. Buscar donde se muestra el precio: `es_the_price()`
3. Reemplazar con el código PHP del punto 4

O bien:

1. **Usar Fields Builder de Estatik** (si tienes PRO)
2. Crear un campo personalizado visual llamado "Precio Formateado"
3. Asignarlo al campo `es_property_price_formatted`
4. Configurar para que se muestre en el lugar del precio

## Verificación

Para verificar que funciona:

1. Sincronizar una propiedad en USD
2. Ir a WordPress > Propiedades > Editar propiedad
3. Buscar en los campos personalizados:
   - `es_property_price`: 150000
   - `es_property_price_currency`: USD
   - `es_property_price_formatted`: USD 150,000

4. Repetir con una propiedad en Pesos:
   - `es_property_price`: 50000000
   - `es_property_price_currency`: ARS
   - `es_property_price_formatted`: Pesos 50.000.000

## Cambios en la Interfaz

- El formulario de propiedades ahora solo muestra dos opciones de moneda: "Dólares" y "Pesos Argentinos"
- En las tablas y tarjetas del catálogo, ARS se muestra como "Pesos" en lugar de "ARS" o "Pesos Argentinos"
- Toda referencia a DOP ha sido eliminada del sistema
