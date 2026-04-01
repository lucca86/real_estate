<?php
/**
 * Script de verificación de taxonomías
 * Ejecuta este código en WordPress para verificar que las taxonomías existen
 */

// Verificar que las taxonomías existen
$taxonomies_to_check = array('es_types', 'es_categories', 'es_statuses', 'es_locations', 'es_features', 'es_amenities', 'es_labels');

echo "<h2>Verificación de Taxonomías</h2>";

foreach ($taxonomies_to_check as $taxonomy) {
    echo "<h3>Taxonomía: $taxonomy</h3>";
    
    if (taxonomy_exists($taxonomy)) {
        echo "<p style='color: green;'>✓ La taxonomía existe</p>";
        
        // Obtener todos los términos
        $terms = get_terms(array(
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
        ));
        
        if (!is_wp_error($terms) && !empty($terms)) {
            echo "<p>Términos encontrados: " . count($terms) . "</p>";
            echo "<ul>";
            foreach ($terms as $term) {
                echo "<li>ID: {$term->term_id} - Nombre: {$term->name} - Slug: {$term->slug}</li>";
            }
            echo "</ul>";
        } else {
            echo "<p style='color: orange;'>⚠ No hay términos en esta taxonomía</p>";
        }
    } else {
        echo "<p style='color: red;'>✗ La taxonomía NO existe</p>";
    }
    
    echo "<hr>";
}

// Verificar una propiedad específica
echo "<h2>Verificar Propiedad</h2>";
echo "<p>Ingresa el ID de una propiedad para ver sus taxonomías:</p>";

$property_id = 57; // Cambia esto por el ID de tu propiedad

if ($property_id) {
    $post = get_post($property_id);
    
    if ($post) {
        echo "<h3>Propiedad: {$post->post_title} (ID: {$property_id})</h3>";
        
        foreach ($taxonomies_to_check as $taxonomy) {
            $terms = wp_get_object_terms($property_id, $taxonomy);
            
            if (!is_wp_error($terms) && !empty($terms)) {
                echo "<p><strong>$taxonomy:</strong></p>";
                echo "<ul>";
                foreach ($terms as $term) {
                    echo "<li>ID: {$term->term_id} - Nombre: {$term->name} - Slug: {$term->slug}</li>";
                }
                echo "</ul>";
            } else {
                echo "<p><strong>$taxonomy:</strong> Sin términos asignados</p>";
            }
        }
    } else {
        echo "<p style='color: red;'>✗ Propiedad no encontrada</p>";
    }
}
?>
