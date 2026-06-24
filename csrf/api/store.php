<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$tempDir = __DIR__ . '/../temp/';
$cleanupTime = 3600; // 1 hour
$lockFile = __DIR__ . '/../.cleanup_lock';

// Lazy cleanup only if cron hasn't run recently (lock older than 10 min)
if (!file_exists($lockFile) || (time() - filemtime($lockFile)) > 600) {
    if (is_dir($tempDir)) {
        $files = glob($tempDir . '*.html');
        $now = time();
        foreach ($files as $file) {
            if ($now - filemtime($file) > $cleanupTime) {
                unlink($file);
            }
        }
    }
    touch($lockFile);
}

// Get POST data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['poc']) || empty($data['poc'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No PoC content provided']);
    exit;
}

// Generate random 25-char ID (like Burp)
$id = bin2hex(random_bytes(13));
$id = substr($id, 0, 25);

// Ensure temp directory exists
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
}

// Store the PoC
$filename = $tempDir . $id . '.html';
$htmlContent = $data['poc'];

// Validate it's HTML
if (stripos($htmlContent, '<html') === false && stripos($htmlContent, '<body') === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid HTML content']);
    exit;
}

file_put_contents($filename, $htmlContent);

// Return shareable URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$path = dirname($_SERVER['SCRIPT_NAME']);
$baseUrl = $protocol . '://' . $host . dirname($path) . '/';

$url = $baseUrl . 'api/get.php?id=' . $id;

echo json_encode([
    'success' => true,
    'id' => $id,
    'url' => $url,
    'expires' => '1 hour'
]);
