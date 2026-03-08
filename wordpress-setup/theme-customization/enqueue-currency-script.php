<?php
/**
 * Código para agregar a functions.php del tema
 * 
 * Este código encola el script de currency-display.js
 * y agrega los custom fields de moneda como data attributes
 */

// 1. Encolar el script de currency display
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

// 2. Agregar custom field de moneda como data attribute en las propiedades
function add_currency_data_attribute($classes, $class, $post_id) {
    if (get_post_type($post_id) === 'properties') {
        $currency = get_post_meta($post_id, 'es_property_price_currency', true);
        if ($currency) {
            echo ' data-currency="' . esc_attr($currency) . '"';
        }
    }
    return $classes;
}
add_filter('post_class', 'add_currency_data_attribute', 10, 3);

// 3. ALTERNATIVA: Filtro para modificar el precio directamente
function modify_estatik_price_display($price, $post_id) {
    $currency = get_post_meta($post_id, 'es_property_price_currency', true);
    $formatted_price = get_post_meta($post_id, 'es_property_price_formatted', true);
    
    // Si existe el precio formateado, usarlo directamente
    if ($formatted_price) {
        return $formatted_price;
    }
    
    // Si no, construir el precio con moneda
    if ($currency && $price) {
        $badge_color = ($currency === 'USD') ? '#10b981' : '#f59e0b';
        $currency_badge = '<span class="property-currency-badge" style="display:inline-block;background:' . $badge_color . ';color:white;padding:2px 8px;border-radius:4px;font-size:0.75em;font-weight:600;margin-right:6px;">' . esc_html($currency) . '</span>';
        return $currency_badge . $price;
    }
    
    return $price;
}

// Intentar con varios filtros de Estatik (descomenta el que funcione con tu tema)
// add_filter('es_property_price', 'modify_estatik_price_display', 10, 2);
// add_filter('estatik_price_format', 'modify_estatik_price_display', 10, 2);

// 4. Shortcode personalizado para mostrar precio con moneda
function property_price_with_currency_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => get_the_ID()
    ), $atts);
    
    $post_id = $atts['id'];
    $currency = get_post_meta($post_id, 'es_property_price_currency', true);
    $formatted_price = get_post_meta($post_id, 'es_property_price_formatted', true);
    $price = get_post_meta($post_id, 'es_property_price', true);
    
    // Usar precio formateado si existe
    if ($formatted_price) {
        return '<span class="property-price-currency">' . esc_html($formatted_price) . '</span>';
    }
    
    // Construir precio con moneda
    if ($currency && $price) {
        $badge_color = ($currency === 'USD') ? '#10b981' : '#f59e0b';
        $currency_badge = '<span class="property-currency-badge" style="display:inline-block;background:' . $badge_color . ';color:white;padding:2px 8px;border-radius:4px;font-size:0.75em;font-weight:600;margin-right:6px;vertical-align:middle;">' . esc_html($currency) . '</span>';
        $formatted = number_format($price, 0, ',', '.');
        return '<span class="property-price-currency">' . $currency_badge . '$' . $formatted . '</span>';
    }
    
    return $price ? '$' . number_format($price, 0, ',', '.') : '';
}
add_shortcode('property_price_currency', 'property_price_with_currency_shortcode');

// 5. Agregar CSS personalizado para los badges
function currency_badge_styles() {
    ?>
    <style>
        .property-currency-badge {
            display: inline-block !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
            font-size: 0.75em !important;
            font-weight: 600 !important;
            margin-right: 6px !important;
            vertical-align: middle !important;
            color: white !important;
        }
        .property-currency-usd {
            background: #10b981 !important;
        }
        .property-currency-ars {
            background: #f59e0b !important;
        }
        .property-price-currency {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
    </style>
    <?php
}
add_action('wp_head', 'currency_badge_styles');
?>
