<?php
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

// Get ID from query parameter
$id = isset($_GET['id']) ? $_GET['id'] : '';

// Validate ID (25 alphanumeric chars)
if (!preg_match('/^[a-f0-9]{25}$/', $id)) {
    http_response_code(404);
    echo '<html><body><h1>404 - Not Found</h1><p>Invalid or expired link.</p></body></html>';
    exit;
}

$filename = $tempDir . $id . '.html';

if (!file_exists($filename)) {
    http_response_code(404);
    echo '<html><body><h1>404 - Not Found</h1><p>This link has expired or been deleted.</p></body></html>';
    exit;
}

// Check if expired
if (time() - filemtime($filename) > $cleanupTime) {
    unlink($filename);
    http_response_code(410);
    echo '<html><body><h1>410 - Gone</h1><p>This link has expired and been permanently deleted.</p></body></html>';
    exit;
}

// Serve the HTML
header('Content-Type: text/html; charset=UTF-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');

readfile($filename);
