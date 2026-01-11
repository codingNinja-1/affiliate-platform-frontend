<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost',
        'http://127.0.0.1',
        // Common LAN hosts
        'http://192.168.1.134:3000',
        'http://192.168.1.134:3001',
        'http://192.168.1.134',
        'http://192.168.1.103:3000',
        'http://192.168.1.103:3001',
        'http://192.168.1.103',
    ],

    'allowed_origins_patterns' => [
        // Allow any local LAN origin on 192.168.1.x with optional port
        '^https?:\/\/192\.168\.1\.\d{1,3}(?::\d+)?$'
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
