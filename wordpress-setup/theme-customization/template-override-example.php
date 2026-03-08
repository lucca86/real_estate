<?php
/**
 * EJEMPLO: Cómo override del template de Estatik
 * 
 * Archivo: content-archive.php (listado de propiedades)
 * Ubicación original: /wp-content/plugins/estatik/templates/front/property/content-archive.php
 * Ubicación destino: /wp-content/themes/TU-TEMA/estatik4/front/property/content-archive.php
 * 
 * Este es solo un EJEMPLO de cómo modificar el template.
 * Debes copiar el archivo original de Estatik y modificar la parte del precio.
 */

// BUSCA esta línea en el template original de Estatik:
// <?php echo es_get_the_price(); ?>

// Y REEMPLÁZALA por:
?>
<div class="es-property-price">
    <?php 
    // Usar nuestra función personalizada
    $price_with_currency = get_property_price_with_currency(get_the_ID());
    if (!empty($price_with_currency)) {
        echo '<span class="es-price-value">' . esc_html($price_with_currency) . '</span>';
    } else {
        // Fallback al precio original de Estatik
        echo es_get_the_price(); 
    }
    ?>
</div>

<?php
// O ALTERNATIVAMENTE, agregar un badge antes del precio:
?>
<div class="es-property-price-with-currency">
    <?php 
    // Mostrar badge de moneda
    $currency = get_post_meta(get_the_ID(), 'es_property_price_currency', true);
    if (!empty($currency)) {
        $badge_class = ($currency === 'USD') ? 'currency-badge-usd' : 'currency-badge-ars';
        echo '<span class="property-currency-badge ' . esc_attr($badge_class) . '">' . esc_html($currency) . '</span>';
    }
    
    // Mostrar el precio formateado
    echo get_property_price_with_currency(get_the_ID());
    ?>
</div>
