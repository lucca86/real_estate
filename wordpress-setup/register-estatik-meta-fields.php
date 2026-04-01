<?php
/**
 * Register Estatik Meta Fields for REST API
 * 
 * Add this code to your WordPress theme's functions.php file
 * or create a custom plugin with this code.
 * 
 * This allows the REST API to read and write Estatik property meta fields.
 */

add_action('init', 'register_estatik_meta_fields_for_rest');

function register_estatik_meta_fields_for_rest() {
    // Define all meta fields used by Estatik
    $meta_fields = [
        'property_type' => 'string',
        'transaction_type' => 'string',
        'property_status' => 'string',
        'price' => 'number',
        'currency' => 'string',
        'bedrooms' => 'number',
        'bathrooms' => 'number',
        'area' => 'number',
        'address' => 'string',
        'city' => 'string',
        'state' => 'string',
        'country' => 'string',
        'latitude' => 'number',
        'longitude' => 'number',
        'features' => 'array',
        'amenities' => 'array',
        'images' => 'array',
    ];

    // Register each meta field
    foreach ($meta_fields as $field_name => $field_type) {
        register_post_meta('properties', $field_name, [
            'type' => $field_type,
            'single' => true,
            'show_in_rest' => true,
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ]);
    }
}

/**
 * Alternative: If the above doesn't work, try using register_meta instead
 */
/*
add_action('rest_api_init', 'register_estatik_meta_for_rest_api');

function register_estatik_meta_for_rest_api() {
    $meta_fields = [
        'property_type', 'transaction_type', 'property_status',
        'price', 'currency', 'bedrooms', 'bathrooms', 'area',
        'address', 'city', 'state', 'country',
        'latitude', 'longitude', 'features', 'amenities', 'images'
    ];

    foreach ($meta_fields as $field) {
        register_rest_field('properties', $field, [
            'get_callback' => function($object) use ($field) {
                return get_post_meta($object['id'], $field, true);
            },
            'update_callback' => function($value, $object) use ($field) {
                return update_post_meta($object->ID, $field, $value);
            },
            'schema' => null,
        ]);
    }
}
*/
