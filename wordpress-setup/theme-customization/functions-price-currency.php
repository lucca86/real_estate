<?php
/**
 * Estatik Price Currency Customization
 * 
 * Este archivo contiene funciones para mostrar precios con moneda en Estatik.
 * Agregar este código al functions.php de tu tema o child theme.
 */

// ============================================
// OPCIÓN 1: Filtro para modificar el precio en toda la visualización
// ============================================

/**
 * Modifica cómo se muestra el precio en Estatik
 * Este filtro intercepta el precio antes de mostrarse
 */
function custom_estatik_price_display($price_html, $property_id) {
    // Obtener el precio formateado con moneda desde nuestro meta field
    $formatted_price = get_post_meta($property_id, 'es_property_price_formatted', true);
    
    // Si existe el precio formateado, usarlo
    if (!empty($formatted_price)) {
        return '<span class="es-price-value">' . esc_html($formatted_price) . '</span>';
    }
    
    // Si no, obtener precio y moneda por separado
    $currency = get_post_meta($property_id, 'es_property_price_currency', true);
    $price = get_post_meta($property_id, 'es_property_price', true);
    
    if (!empty($currency) && !empty($price)) {
        // Formatear el precio con separadores de miles
        $formatted = number_format($price, 0, ',', '.');
        $currency_label = ($currency === 'USD') ? 'USD' : 'Pesos';
        
        return '<span class="es-price-value">' . esc_html($currency_label . ' ' . $formatted) . '</span>';
    }
    
    // Si no hay información de moneda, devolver el precio original
    return $price_html;
}
add_filter('es_property_price', 'custom_estatik_price_display', 10, 2);


// ============================================
// OPCIÓN 2: Shortcode para usar en cualquier lugar
// ============================================

/**
 * Shortcode: [property_price_with_currency]
 * Uso: Puedes usarlo en widgets, páginas o posts
 * Ejemplo: [property_price_with_currency id="123"]
 */
function property_price_with_currency_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => get_the_ID(), // Por defecto usa el ID actual
    ), $atts);
    
    $property_id = intval($atts['id']);
    
    // Obtener el precio formateado
    $formatted_price = get_post_meta($property_id, 'es_property_price_formatted', true);
    
    if (!empty($formatted_price)) {
        return '<span class="property-price-currency">' . esc_html($formatted_price) . '</span>';
    }
    
    // Fallback: construir el precio manualmente
    $currency = get_post_meta($property_id, 'es_property_price_currency', true);
    $price = get_post_meta($property_id, 'es_property_price', true);
    
    if (!empty($price)) {
        $formatted = number_format($price, 0, ',', '.');
        $currency_label = (!empty($currency) && $currency === 'USD') ? 'USD' : 'Pesos';
        return '<span class="property-price-currency">' . esc_html($currency_label . ' ' . $formatted) . '</span>';
    }
    
    return '';
}
add_shortcode('property_price_with_currency', 'property_price_with_currency_shortcode');


// ============================================
// OPCIÓN 3: Función de ayuda para usar en templates
// ============================================

/**
 * Función de ayuda para obtener el precio con moneda
 * Uso en templates PHP: <?php echo get_property_price_with_currency(); ?>
 */
function get_property_price_with_currency($property_id = null) {
    if (empty($property_id)) {
        $property_id = get_the_ID();
    }
    
    // Obtener el precio formateado
    $formatted_price = get_post_meta($property_id, 'es_property_price_formatted', true);
    
    if (!empty($formatted_price)) {
        return $formatted_price;
    }
    
    // Fallback: construir el precio manualmente
    $currency = get_post_meta($property_id, 'es_property_price_currency', true);
    $price = get_post_meta($property_id, 'es_property_price', true);
    
    if (!empty($price)) {
        $formatted = number_format($price, 0, ',', '.');
        $currency_label = (!empty($currency) && $currency === 'USD') ? 'USD' : 'Pesos';
        return $currency_label . ' ' . $formatted;
    }
    
    return '';
}


// ============================================
// OPCIÓN 4: Agregar la moneda como badge/etiqueta
// ============================================

/**
 * Agrega un badge con la moneda en el listado de propiedades
 */
function add_currency_badge_to_property() {
    $currency = get_post_meta(get_the_ID(), 'es_property_price_currency', true);
    
    if (!empty($currency)) {
        $badge_class = ($currency === 'USD') ? 'currency-badge-usd' : 'currency-badge-ars';
        $currency_label = ($currency === 'USD') ? 'USD' : 'ARS';
        
        echo '<span class="property-currency-badge ' . esc_attr($badge_class) . '">' . esc_html($currency_label) . '</span>';
    }
}
add_action('es_property_before_price', 'add_currency_badge_to_property');


// ============================================
// OPCIÓN 5: Estilos CSS personalizados
// ============================================

/**
 * Agregar estilos CSS para los precios con moneda
 */
function custom_estatik_currency_styles() {
    ?>
    <style type="text/css">
        /* Estilo para el precio con moneda */
        .property-price-currency {
            font-weight: 600;
            color: #2c3e50;
        }
        
        /* Badge de moneda */
        .property-currency-badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 3px;
            margin-right: 5px;
            text-transform: uppercase;
        }
        
        .currency-badge-usd {
            background-color: #27ae60;
            color: white;
        }
        
        .currency-badge-ars {
            background-color: #3498db;
            color: white;
        }
        
        /* Resaltar precios en USD */
        .es-price-value:has(.currency-badge-usd) {
            color: #27ae60;
        }
    </style>
    <?php
}
add_action('wp_head', 'custom_estatik_currency_styles');

?>
