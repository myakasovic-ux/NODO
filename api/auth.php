<?php
$ruta = dirname(__DIR__, 2) . '/usuario/config_ldm.php';

if (!file_exists($ruta) || !is_readable($ruta)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Config file not accessible']);
    exit;
}

require_once $ruta;
