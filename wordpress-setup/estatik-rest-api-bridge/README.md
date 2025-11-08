# Estatik REST API Bridge Plugin

Este plugin de WordPress expone un endpoint REST API personalizado que permite sincronizar propiedades con todos los meta fields de Estatik, bypaseando la restricción de `show_in_rest`.

## Instalación

1. **Subir el plugin a WordPress:**
   \`\`\`
   wp-content/plugins/estatik-rest-api-bridge/
   \`\`\`

2. **Activar el plugin:**
   - Ve a WordPress Admin → Plugins
   - Busca "Estatik REST API Bridge"
   - Haz clic en "Activar"

3. **Verificar que funciona:**
   - El plugin expondrá los siguientes endpoints:
     - `POST /wp-json/estatik-bridge/v1/properties` - Crear propiedad
     - `PUT /wp-json/estatik-bridge/v1/properties/{id}` - Actualizar propiedad
     - `DELETE /wp-json/estatik-bridge/v1/properties/{id}` - Eliminar propiedad

## Endpoints

### Crear Propiedad

\`\`\`bash
POST /wp-json/estatik-bridge/v1/properties
Authorization: Basic {base64(username:app_password)}
Content-Type: application/json

{
  "title": "Casa en venta",
  "content": "Descripción de la propiedad",
  "status": "publish",
  "meta": {
    "es_price": 250000,
    "es_area": 150,
    "bedrooms": 3,
    "bathrooms": 2,
    "es_address": "Calle Principal 123",
    "es_city": "Madrid"
  },
  "taxonomies": {
    "es_type": ["house"],
    "es_category": ["sale"],
    "es_status": ["active"]
  }
}
\`\`\`

### Actualizar Propiedad

\`\`\`bash
PUT /wp-json/estatik-bridge/v1/properties/123
Authorization: Basic {base64(username:app_password)}
Content-Type: application/json

{
  "title": "Casa actualizada",
  "meta": {
    "es_price": 260000
  }
}
\`\`\`

### Eliminar Propiedad

\`\`\`bash
DELETE /wp-json/estatik-bridge/v1/properties/123
Authorization: Basic {base64(username:app_password)}
\`\`\`

## Seguridad

- El plugin verifica que el usuario tenga permisos de `edit_posts`
- Todos los datos se sanitizan antes de guardar
- Solo se permiten campos específicos de Estatik

## Campos Soportados

### Meta Fields
- `es_price` - Precio
- `es_price_per_sqft` - Precio por pie cuadrado
- `es_area` - Área construida
- `es_lot_size` - Tamaño del lote
- `bedrooms` - Dormitorios
- `bathrooms` - Baños
- `half_baths` - Medios baños
- `total_rooms` - Habitaciones totales
- `es_year_built` - Año de construcción
- `es_address` - Dirección
- `es_city` - Ciudad
- `es_state` - Estado/Provincia
- `es_zip` - Código postal
- `es_country` - País
- `es_latitude` - Latitud
- `es_longitude` - Longitud
- `es_features` - Características
- `es_amenities` - Amenidades
- `es_gallery` - Galería de imágenes
- `es_video_url` - URL de video
- `es_virtual_tour` - Tour virtual
- `es_rent_period` - Período de alquiler
- `date_added` - Fecha agregada
- `external_id` - ID externo

### Taxonomías
- `es_type` - Tipo de propiedad (house, apartment, etc.)
- `es_category` - Categoría (sale, rent)
- `es_status` - Estado (active, sold, etc.)

## Troubleshooting

### Error 401: No autorizado
- Verifica que las credenciales de WordPress sean correctas
- Asegúrate de usar un Application Password, no la contraseña normal

### Error 403: Permisos insuficientes
- El usuario debe tener rol de Editor o Administrador

### Los campos no se guardan
- Verifica que los nombres de los campos coincidan exactamente con los listados arriba
- Revisa los logs de WordPress para ver errores específicos
\`\`\`

```typescript file="" isHidden
