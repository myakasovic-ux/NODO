<?php
require_once __DIR__ . '/auth.php'; // ajusta ruta si corresponde

header('Content-Type: application/json; charset=utf-8');

try {
    // Validar método HTTP primero
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? [];

    if (!is_array($data) || empty($data['action'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
        exit;
    }

    // Normaliza la ruta
    $pagina = $data['pagina'] ?? '/';
    $pagina = rtrim(parse_url($pagina, PHP_URL_PATH) ?? '/', '/');
    if ($pagina === '')
        $pagina = '/';

    // Solo permitir HOME
    $allowHome = ['/', '/index.html'];

    if (!in_array($pagina, $allowHome, true)) {
        echo json_encode([
            'ok' => true,
            'skipped' => true,
            'reason' => 'not_home',
            'pagina' => $pagina
        ]);
        exit;
    }

    $action = $data['action'];

    // Fecha del servidor (Chile). Ajusta si tu server no está en CL:
    // date_default_timezone_set('America/Santiago');
    $fecha = date('Y-m-d');

    // $pagina ya está normalizada arriba, no reasignar

    $device = isset($data['device']) ? $data['device'] : 'unknown';     // desktop|mobile|tablet|unknown
    $ref = isset($data['ref']) ? $data['ref'] : 'other';                // direct|google|facebook|instagram|tiktok|other

    $duracion = isset($data['duracion_seg']) ? (int) $data['duracion_seg'] : 0;

    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // Asegura fila del día (si no existe la crea)
    // Luego actualiza contadores según action.

    // Mapeo seguro de columnas permitidas (evita SQL injection en nombres)
    $deviceColMap = [
        'desktop' => 'device_desktop',
        'mobile' => 'device_mobile',
        'tablet' => 'device_tablet',
        'unknown' => 'device_unknown',
    ];
    $refColMap = [
        'direct' => 'ref_direct',
        'google' => 'ref_google',
        'facebook' => 'ref_facebook',
        'instagram' => 'ref_instagram',
        'tiktok' => 'ref_tiktok',
        'other' => 'ref_other',
    ];

    $deviceCol = $deviceColMap[$device] ?? 'device_unknown';
    $refCol = $refColMap[$ref] ?? 'ref_other';

    if ($action === 'start') {

        $sql = "
          INSERT INTO visitas_diarias (fecha, pagina, visitas, sesiones, {$deviceCol}, {$refCol})
          VALUES (:fecha, :pagina, 1, 1, 1, 1)
          ON DUPLICATE KEY UPDATE
            visitas = visitas + 1,
            sesiones = sesiones + 1,
            {$deviceCol} = {$deviceCol} + 1,
            {$refCol} = {$refCol} + 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fecha' => $fecha,
            ':pagina' => $pagina,
        ]);

        echo json_encode(['ok' => true]);
        exit;
    }

    if ($action === 'end') {
        // Solo suma duración si tiene sentido (ej: >0)
        if ($duracion < 0)
            $duracion = 0;
        if ($duracion > 86400)
            $duracion = 86400; // cap 24h por seguridad

        $sql = "
          INSERT INTO visitas_diarias (fecha, pagina, duracion_total_seg, sesiones_con_duracion)
          VALUES (:fecha, :pagina, :dur1, 1)
          ON DUPLICATE KEY UPDATE
            duracion_total_seg = duracion_total_seg + :dur2,
            sesiones_con_duracion = sesiones_con_duracion + 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fecha' => $fecha,
            ':pagina' => $pagina,
            ':dur1' => $duracion,
            ':dur2' => $duracion,
        ]);

        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
    exit;
}
