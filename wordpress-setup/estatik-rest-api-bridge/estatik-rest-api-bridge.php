<?php
/**
 * Plugin Name: Estatik REST API Bridge
 * Description: Expone un endpoint REST API personalizado para sincronizar propiedades con todos los meta fields de Estatik
 * Version: 3.0.0
 * Author: Real Estate Management System
 */

if (!defined('ABSPATH')) {
    exit;
}

register_activation_hook(__FILE__, 'estatik_bridge_activate');
add_action('init', 'estatik_bridge_register_taxonomies', 0);

/**
 * Plugin activation - Register taxonomies and flush rewrite rules
 */
function estatik_bridge_activate() {
    estatik_bridge_register_taxonomies();
    flush_rewrite_rules();
    error_log('[Estatik Bridge] Plugin activated - Taxonomies registered');
}

/**
 * Register Estatik taxonomies if they don't exist
 * Changed all taxonomy names from plural to singular to match WordPress/Estatik
 */
function estatik_bridge_register_taxonomies() {
    // Register properties post type if it doesn't exist
    if (!post_type_exists('properties')) {
        register_post_type('properties', array(
            'labels' => array(
                'name' => 'Propiedades',
                'singular_name' => 'Propiedad',
            ),
            'public' => true,
            'has_archive' => true,
            'rewrite' => array('slug' => 'propiedades'),
            'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt'),
            'show_in_rest' => true,
            'menu_icon' => 'dashicons-admin-home',
        ));
        error_log('[Estatik Bridge] Registered post type: properties');
    }

    // Define all Estatik taxonomies (SINGULAR names)
    $taxonomies = array(
        'es_type' => array('label' => 'Tipos de Propiedad', 'singular' => 'Tipo de Propiedad', 'slug' => 'tipo-propiedad'),
        'es_category' => array('label' => 'Categorías', 'singular' => 'Categoría', 'slug' => 'categoria-propiedad'),
        'es_status' => array('label' => 'Estados', 'singular' => 'Estado', 'slug' => 'estado-propiedad'),
        'es_feature' => array('label' => 'Características', 'singular' => 'Característica', 'slug' => 'caracteristica'),
        'es_amenity' => array('label' => 'Amenidades', 'singular' => 'Amenidad', 'slug' => 'amenidad'),
        'es_label' => array('label' => 'Etiquetas', 'singular' => 'Etiqueta', 'slug' => 'etiqueta-propiedad'),
        'es_location' => array('label' => 'Ubicaciones', 'singular' => 'Ubicación', 'slug' => 'ubicacion'),
    );

    // Register each taxonomy
    foreach ($taxonomies as $taxonomy => $config) {
        if (!taxonomy_exists($taxonomy)) {
            register_taxonomy($taxonomy, 'properties', array(
                'labels' => array(
                    'name' => $config['label'],
                    'singular_name' => $config['singular'],
                ),
                'hierarchical' => true,
                'show_ui' => true,
                'show_admin_column' => true,
                'query_var' => true,
                'rewrite' => array('slug' => $config['slug']),
                'show_in_rest' => true,
                'public' => true,
            ));
        }
    }
}

class Estatik_REST_API_Bridge {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Registra las rutas REST API personalizadas
     */
    public function register_routes() {
        register_rest_route('estatik-bridge/v1', '/properties', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_property'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route('estatik-bridge/v1', '/properties/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_property'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route('estatik-bridge/v1', '/properties/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_property'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route('estatik-bridge/v1', '/properties/(?P<id>\d+)/debug', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_property'),
            'permission_callback' => array($this, 'check_permission'),
        ));
    }
    
    /**
     * Verifica permisos de usuario
     */
    public function check_permission($request) {
        return current_user_can('edit_posts');
    }

    /**
     * Crea una nueva propiedad
     */
    public function create_property($request) {
        $params = $request->get_json_params();
        
        // Log para debug
        error_log('[Estatik Bridge] Creating property: ' . $params['title']);
        
        // Crear el post
        $post_data = array(
            'post_title'   => sanitize_text_field($params['title'] ?? ''),
            'post_content' => wp_kses_post($params['content'] ?? ''),
            'post_status'  => sanitize_text_field($params['status'] ?? 'publish'),
            'post_type'    => 'properties', // Custom post type de Estatik
        );
        
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            error_log('[Estatik Bridge] Error creating post: ' . $post_id->get_error_message());
            return new WP_Error('create_failed', 'No se pudo crear la propiedad', array('status' => 500));
        }
        
        error_log('[Estatik Bridge] Post created with ID: ' . $post_id);
        
        if (isset($params['sticky']) && $params['sticky']) {
            stick_post($post_id);
        }
        
        // Guardar meta fields
        if (isset($params['meta']) && is_array($params['meta'])) {
            $this->save_meta_fields($post_id, $params['meta']);
        }
        
        // Asignar taxonomías
        if (isset($params['taxonomies']) && is_array($params['taxonomies'])) {
            $this->assign_taxonomies($post_id, $params['taxonomies']);
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'post_id' => $post_id,
            'message' => 'Propiedad creada exitosamente'
        ));
    }
    
    /**
     * Actualiza una propiedad existente
     */
    public function update_property($request) {
        $post_id = $request->get_param('id');
        $params = $request->get_json_params();
        
        // Log para debug
        error_log('[Estatik Bridge] Updating property ' . $post_id);
        
        // Verificar que el post existe
        $post = get_post($post_id);
        if (!$post) {
            error_log('[Estatik Bridge] Post ' . $post_id . ' not found');
            return new WP_Error('not_found', 'Propiedad no encontrada', array('status' => 404));
        }
        
        // Actualizar el post
        $post_data = array('ID' => $post_id);
        
        if (isset($params['title'])) {
            $post_data['post_title'] = sanitize_text_field($params['title']);
        }
        
        if (isset($params['content'])) {
            $post_data['post_content'] = wp_kses_post($params['content']);
        }
        
        if (isset($params['status'])) {
            $post_data['post_status'] = sanitize_text_field($params['status']);
        }
        
        $result = wp_update_post($post_data);
        
        if (is_wp_error($result)) {
            error_log('[Estatik Bridge] Error updating post: ' . $result->get_error_message());
            return new WP_Error('update_failed', 'No se pudo actualizar la propiedad', array('status' => 500));
        }
        
        // Marcar como destacada o no
        if (isset($params['sticky'])) {
            if ($params['sticky']) {
                stick_post($post_id);
            } else {
                unstick_post($post_id);
            }
        }
        
        // Actualizar meta fields
        if (isset($params['meta']) && is_array($params['meta'])) {
            $this->save_meta_fields($post_id, $params['meta']);
        }
        
        // Actualizar taxonomías
        if (isset($params['taxonomies']) && is_array($params['taxonomies'])) {
            $this->assign_taxonomies($post_id, $params['taxonomies']);
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'post_id' => $post_id,
            'message' => 'Propiedad actualizada exitosamente'
        ));
    }
    
    /**
     * Elimina una propiedad
     */
    public function delete_property($request) {
        $post_id = $request->get_param('id');
        
        if (!get_post($post_id)) {
            return new WP_Error('not_found', 'Propiedad no encontrada', array('status' => 404));
        }
        
        $result = wp_delete_post($post_id, true);
        
        if (!$result) {
            return new WP_Error('delete_failed', 'No se pudo eliminar la propiedad', array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Propiedad eliminada exitosamente'
        ));
    }
    
    /**
     * Guarda los meta fields de la propiedad
     */
    private function save_meta_fields($post_id, $meta_fields) {
        error_log('[Estatik Bridge] Saving meta fields for post ' . $post_id);
        
        // Lista de campos permitidos de Estatik
        $allowed_fields = array(
            'es_property_price', 'es_property_price_per_sqft', 'es_property_bedrooms',
            'es_property_bathrooms', 'es_property_half_baths', 'es_property_total_rooms',
            'es_property_floors', 'es_property_floor_level', 'es_property_area',
            'es_property_lot_size', 'es_property_year_built', 'es_property_year_remodeled',
            'es_property_featured', 'es_property_parking', 'es_property_address',
            'es_property_latitude', 'es_property_longitude', 'es_property_postal_code',
            'es_property_address_components', 'es_property_gallery', 'es_property_video_url',
            'es_property_virtual_tour', 'es_property_is_open_house', 'es_property_is_appointment_only',
            'es_property_appointments', 'es_property_keywords', '_thumbnail_id',
        );
        
        foreach ($meta_fields as $key => $value) {
            if (in_array($key, $allowed_fields)) {
                if ($key === 'es_property_gallery' && is_array($value)) {
                    $sanitized_value = array_map('sanitize_text_field', $value);
                } elseif (is_array($value)) {
                    $sanitized_value = array_map('sanitize_text_field', $value);
                } else {
                    $sanitized_value = sanitize_text_field($value);
                }
                
                update_post_meta($post_id, $key, $sanitized_value);
                error_log('[Estatik Bridge] Updated meta ' . $key);
            }
        }
    }
    
    /**
     * Asigna taxonomías a la propiedad
     * Changed allowed taxonomies from plural to singular
     */
    private function assign_taxonomies($post_id, $taxonomies) {
        error_log('[Estatik Bridge] ========================================');
        error_log('[Estatik Bridge] ASSIGNING TAXONOMIES TO POST: ' . $post_id);
        error_log('[Estatik Bridge] ========================================');
        error_log('[Estatik Bridge] Taxonomies received: ' . print_r($taxonomies, true));
        
        $allowed_taxonomies = array('es_type', 'es_category', 'es_status', 'es_location', 'es_feature', 'es_amenity', 'es_label');
        
        foreach ($taxonomies as $taxonomy => $terms) {
            error_log('[Estatik Bridge] ----------------------------------------');
            error_log('[Estatik Bridge] Processing taxonomy: ' . $taxonomy);
            error_log('[Estatik Bridge] Terms: ' . print_r($terms, true));
            
            if (!in_array($taxonomy, $allowed_taxonomies)) {
                error_log('[Estatik Bridge] ✗ Skipped (not in allowed list)');
                continue;
            }
            
            if (!taxonomy_exists($taxonomy)) {
                error_log('[Estatik Bridge] ✗ ERROR: Taxonomy ' . $taxonomy . ' does NOT exist in WordPress!');
                continue;
            }
            
            error_log('[Estatik Bridge] ✓ Taxonomy ' . $taxonomy . ' exists');
            
            if (!is_array($terms)) {
                $terms = array($terms);
            }
            
            $term_ids = array();
            
            foreach ($terms as $term) {
                if (is_numeric($term)) {
                    $term_obj = get_term($term, $taxonomy);
                    if ($term_obj && !is_wp_error($term_obj)) {
                        $term_ids[] = intval($term);
                        error_log('[Estatik Bridge] ✓ Found term by ID: ' . $term . ' (Name: ' . $term_obj->name . ')');
                    } else {
                        error_log('[Estatik Bridge] ✗ ERROR: Term ID ' . $term . ' not found in taxonomy ' . $taxonomy);
                    }
                } else {
                    error_log('[Estatik Bridge] Looking for term by name/slug: ' . $term);
                    
                    $term_obj = $this->find_term_flexible($term, $taxonomy);
                    
                    if ($term_obj) {
                        $term_ids[] = intval($term_obj->term_id);
                        error_log('[Estatik Bridge] ✓ Found existing term: ' . $term_obj->name . ' (ID: ' . $term_obj->term_id . ')');
                    } else {
                        error_log('[Estatik Bridge] Term not found, creating new term: ' . $term);
                        $new_term = wp_insert_term($term, $taxonomy, array(
                            'slug' => sanitize_title($term)
                        ));
                        
                        if (is_wp_error($new_term)) {
                            error_log('[Estatik Bridge] ✗ ERROR creating term: ' . $new_term->get_error_message());
                        } else {
                            $term_ids[] = intval($new_term['term_id']);
                            error_log('[Estatik Bridge] ✓ Created new term: ' . $term . ' (ID: ' . $new_term['term_id'] . ')');
                        }
                    }
                }
            }
            
            if (!empty($term_ids)) {
                error_log('[Estatik Bridge] Setting terms for taxonomy ' . $taxonomy . ': ' . implode(', ', $term_ids));
                
                $result = wp_set_object_terms($post_id, $term_ids, $taxonomy, false);
                
                if (is_wp_error($result)) {
                    error_log('[Estatik Bridge] ✗ ERROR setting terms: ' . $result->get_error_message());
                } else {
                    error_log('[Estatik Bridge] ✓ Successfully set ' . count($term_ids) . ' terms');
                    
                    // Verify assignment
                    $assigned_terms = wp_get_object_terms($post_id, $taxonomy, array('fields' => 'ids'));
                    error_log('[Estatik Bridge] ✓ Verification - Assigned term IDs: ' . implode(', ', $assigned_terms));
                }
            } else {
                error_log('[Estatik Bridge] ⚠ No valid terms to assign for taxonomy ' . $taxonomy);
            }
        }
        
        error_log('[Estatik Bridge] ========================================');
        error_log('[Estatik Bridge] TAXONOMY ASSIGNMENT COMPLETE');
        error_log('[Estatik Bridge] ========================================');
    }
    
    /**
     * New flexible term search function - case-insensitive with multiple strategies
     */
    private function find_term_flexible($term_name, $taxonomy) {
        error_log('[Estatik Bridge] Starting flexible search for: ' . $term_name);
        
        // Strategy 1: Try exact slug match
        $slug = sanitize_title($term_name);
        $term_obj = get_term_by('slug', $slug, $taxonomy);
        if ($term_obj) {
            error_log('[Estatik Bridge] Found by slug: ' . $slug);
            return $term_obj;
        }
        
        // Strategy 2: Try exact name match
        $term_obj = get_term_by('name', $term_name, $taxonomy);
        if ($term_obj) {
            error_log('[Estatik Bridge] Found by exact name: ' . $term_name);
            return $term_obj;
        }
        
        // Strategy 3: Get all terms and do case-insensitive comparison
        $all_terms = get_terms(array(
            'taxonomy' => $taxonomy,
            'hide_empty' => false,
        ));
        
        if (!is_wp_error($all_terms) && !empty($all_terms)) {
            $search_lower = strtolower($term_name);
            $search_slug = sanitize_title($term_name);
            
            foreach ($all_terms as $existing_term) {
                // Compare lowercase names
                if (strtolower($existing_term->name) === $search_lower) {
                    error_log('[Estatik Bridge] Found by case-insensitive name: ' . $existing_term->name);
                    return $existing_term;
                }
                
                // Compare slugs
                if ($existing_term->slug === $search_slug) {
                    error_log('[Estatik Bridge] Found by slug comparison: ' . $existing_term->slug);
                    return $existing_term;
                }
            }
            
            error_log('[Estatik Bridge] Available terms in ' . $taxonomy . ': ' . implode(', ', array_map(function($t) {
                return $t->name . ' (ID: ' . $t->term_id . ', slug: ' . $t->slug . ')';
            }, $all_terms)));
        }
        
        error_log('[Estatik Bridge] Term not found after all search strategies');
        return false;
    }
    
    /**
     * Debug endpoint - Devuelve todos los meta fields y taxonomías de una propiedad
     * Changed taxonomy names from plural to singular
     */
    public function debug_property($request) {
        $post_id = $request->get_param('id');
        
        // Verificar que el post existe
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('not_found', 'Propiedad no encontrada', array('status' => 404));
        }
        
        // Obtener todos los meta fields
        $all_meta = get_post_meta($post_id);
        
        // Obtener taxonomías
        $taxonomies = array();
        $tax_names = array('es_type', 'es_category', 'es_status', 'es_location', 'es_feature', 'es_amenity', 'es_label');
        
        foreach ($tax_names as $tax_name) {
            $terms = wp_get_object_terms($post_id, $tax_name);
            if (!is_wp_error($terms) && !empty($terms)) {
                $taxonomies[$tax_name] = array_map(function($term) {
                    return array(
                        'id' => $term->term_id,
                        'name' => $term->name,
                        'slug' => $term->slug
                    );
                }, $terms);
            }
        }
        
        return rest_ensure_response(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_type' => $post->post_type,
            'post_status' => $post->post_status,
            'meta_fields' => $all_meta,
            'taxonomies' => $taxonomies,
        ));
    }
}

// Inicializar el plugin
new Estatik_REST_API_Bridge();
