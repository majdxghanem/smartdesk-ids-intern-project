<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Content-Disposition'],
    'max_age' => 3600,
    'supports_credentials' => false,
];
