<?php
/**
 * Dedicated cleanup script for Hostinger Cron Job
 * Run this every 15 minutes via Hostinger's cron job panel
 * Example command: php /path/to/public_html/csrf/api/cleanup.php
 */

$tempDir = __DIR__ . '/../temp/';
$cleanupTime = 3600; // 1 hour
$lockFile = __DIR__ . '/../.cleanup_lock';

// Prevent overlapping runs (5 minute lock)
if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 300) {
    exit(0); // Another cleanup is already running or ran recently
}

touch($lockFile);

$deleted = 0;
$kept = 0;

if (is_dir($tempDir)) {
    $files = glob($tempDir . '*.html');
    $now = time();
    foreach ($files as $file) {
        if ($now - filemtime($file) > $cleanupTime) {
            unlink($file);
            $deleted++;
        } else {
            $kept++;
        }
    }
}

// Clean up old lock files (older than 10 minutes)
if (file_exists($lockFile) && (time() - filemtime($lockFile)) > 600) {
    unlink($lockFile);
}

// Optional: log cleanup activity (uncomment if you want logging)
// $logFile = __DIR__ . '/../.cleanup_log';
// file_put_contents($logFile, date('Y-m-d H:i:s') . " - Deleted: $deleted, Kept: $kept\n", FILE_APPEND);

echo "Cleanup complete. Deleted: $deleted, Kept: $kept\n";
