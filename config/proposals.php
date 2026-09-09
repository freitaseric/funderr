<?php

return [
    'documents' => [
        'disk' => env('PROPOSAL_DOCUMENT_DISK', 'local'),
        'max_upload_kb' => (int) env('PROPOSAL_DOCUMENT_MAX_UPLOAD_KB', 10240),
        'allowed_mimes' => ['application/pdf', 'image/jpeg', 'image/png'],
    ],
];
