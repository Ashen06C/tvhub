<?php
/**
 * Submissions & Email Log Inspector API
 * Provides a read-only endpoint to inspect saved submissions and sent emails
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

$dataDir = dirname(__DIR__) . '/data';
$submissionsFile = $dataDir . '/submissions.json';
$mailLogFile = $dataDir . '/mail_log.json';

$action = $_GET['action'] ?? 'submissions';

if ($action === 'mail_logs') {
    $logs = file_exists($mailLogFile) ? json_decode(file_get_contents($mailLogFile), true) : [];
    echo json_encode([
        'success' => true,
        'count'   => count($logs),
        'logs'    => $logs
    ], JSON_PRETTY_PRINT);
    exit;
}

$submissions = file_exists($submissionsFile) ? json_decode(file_get_contents($submissionsFile), true) : [];
echo json_encode([
    'success'     => true,
    'count'       => count($submissions),
    'submissions' => $submissions
], JSON_PRETTY_PRINT);
exit;
