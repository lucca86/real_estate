<?php
/**
 * Script de Verificación de Taxonomías de Propiedades
 * 
 * Este script verifica directamente en la base de datos de WordPress
 * qué taxonomías están realmente guardadas para una propiedad específica.
 * 
 * Uso: Ejecuta este script en WordPress (usando Code Snippets o agregándolo temporalmente a functions.php)
 */

function verify_property_taxonomies($property_id = 57) {
    echo "<h2>Verificación de Taxonomías para Propiedad ID: {$property_id}</h2>";
    
    // Verificar que el post existe
    $post = get_post($property_id);
    if (!$post) {
        echo "<p style='color: red;'>❌ La propiedad con ID {$property_id} no existe</p>";
        return;
    }
    
    echo "<p><strong>Título:</strong> {$post->post_title}</p>";
    echo "<p><strong>Tipo de Post:</strong> {$post->post_type}</p>";
    echo "<hr>";
    
    // Lista de taxonomías de Estatik
    $taxonomies = array(
        'es_types' => 'Tipo de Propiedad',
        'es_categories' => 'Categoría (Alquiler/Venta)',
        'es_statuses' => 'Estado',
        'es_features' => 'Características',
        'es_amenities' => 'Amenidades',
        'es_labels' => 'Etiquetas',
        'es_locations' => 'Ubicaciones'
    );
    
    foreach ($taxonomies as $taxonomy => $label) {
        echo "<h3>{$label} ({$taxonomy})</h3>";
        
        // Verificar si la taxonomía existe
        if (!taxonomy_exists($taxonomy)) {
            echo "<p style='color: red;'>❌ La taxonomía {$taxonomy} NO existe en WordPress</p>";
            continue;
        }
        
        echo "<p style='color: green;'>✓ La taxonomía existe</p>";
        
        // Obtener los términos asignados a esta propiedad
        $terms = wp_get_object_terms($property_id, $taxonomy, array('fields' => 'all'));
        
        if (is_wp_error($terms)) {
            echo "<p style='color: red;'>❌ Error al obtener términos: {$terms->get_error_message()}</p>";
            continue;
        }
        
        if (empty($terms)) {
            echo "<p style='color: orange;'>⚠ No hay términos asignados a esta propiedad</p>";
        } else {
            echo "<p style='color: green;'>✓ Términos asignados: " . count($terms) . "</p>";
            echo "<ul>";
            foreach ($terms as $term) {
                echo "<li><strong>{$term->name}</strong> (ID: {$term->term_id}, Slug: {$term->slug})</li>";
            }
            echo "</ul>";
        }
        
        echo "<hr>";
    }
    
    // Verificar todos los términos disponibles en cada taxonomía
    echo "<h2>Términos Disponibles en Cada Taxonomía</h2>";
    
    foreach ($taxonomies as $taxonomy => $label) {
        if (!taxonomy_exists($taxonomy)) {
            continue;
        }
        
        echo "<h3>{$label} ({$taxonomy})</h3>";
        
        $all_terms = get_terms(array(
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
        ));
        
        if (is_wp_error($all_terms)) {
            echo "<p style='color: red;'>❌ Error: {$all_terms->get_error_message()}</p>";
            continue;
        }
        
        if (empty($all_terms)) {
            echo "<p style='color: orange;'>⚠ No hay términos en esta taxonomía</p>";
        } else {
            echo "<p>Total de términos: " . count($all_terms) . "</p>";
            echo "<ul>";
            foreach ($all_terms as $term) {
                echo "<li><strong>{$term->name}</strong> (ID: {$term->term_id}, Slug: {$term->slug}, Count: {$term->count})</li>";
            }
            echo "</ul>";
        }
        
        echo "<hr>";
    }
}

// Ejecutar la verificación para la propiedad ID 57
verify_property_taxonomies(57);

// También verificar la propiedad ID 22 (la que aparece vacía en la imagen)
echo "<hr><hr>";
verify_property_taxonomies(22);
?>
