<?php
/**
 * Contact Form API Handler
 */

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON header for AJAX responses
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// Define data directories and files
$dataDir = dirname(__DIR__) . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$submissionsFile = $dataDir . '/submissions.json';
$mailLogFile = $dataDir . '/mail_log.json';

// Initialize submissions file
if (!file_exists($submissionsFile)) {
    file_put_contents($submissionsFile, json_encode([], JSON_PRETTY_PRINT));
}

// Initialize mail log file
if (!file_exists($mailLogFile)) {
    file_put_contents($mailLogFile, json_encode([], JSON_PRETTY_PRINT));
}

// Admin email address requirement (Designated Administrators)
$adminEmails = [
    'dumidu.kodithuwakku@ebeyonds.com',
    'prabhath.senadheera@ebeyonds.com'
];

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed. Only POST requests are accepted.'
    ]);
    exit;
}

// Read input
$rawInput = file_get_contents('php://input');
$inputData = [];

$contentType = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';
if (stripos($contentType, 'application/json') !== false && !empty($rawInput)) {
    $inputData = json_decode($rawInput, true) ?: [];
} else {
    $inputData = $_POST;
}

// Extract and sanitize fields
$firstName = isset($inputData['firstName']) ? trim(strip_tags($inputData['firstName'])) : '';
$lastName  = isset($inputData['lastName'])  ? trim(strip_tags($inputData['lastName']))  : '';
$email     = isset($inputData['email'])     ? trim(filter_var($inputData['email'], FILTER_SANITIZE_EMAIL)) : '';
$phone     = isset($inputData['phone'])     ? trim(strip_tags($inputData['phone']))     : '';
$comments  = isset($inputData['comments'])  ? trim(strip_tags($inputData['comments']))  : '';
$csrfToken = isset($inputData['csrf_token']) ? trim($inputData['csrf_token']) : '';

// Validation errors collection
$errors = [];

// Helper function for safe string length
function strLenSafe($str) {
    return function_exists('mb_strlen') ? mb_strlen($str, 'UTF-8') : strlen($str);
}

// Validate First Name 
if (empty($firstName)) {
    $errors['firstName'] = 'First name is required.';
} elseif (strLenSafe($firstName) < 2 || strLenSafe($firstName) > 50) {
    $errors['firstName'] = 'First name must be between 2 and 50 characters.';
} elseif (!preg_match("/^[a-zA-Z\s\-']+$/", $firstName)) {
    $errors['firstName'] = 'First name contains invalid characters.';
}

// Validate Last Name 
if (empty($lastName)) {
    $errors['lastName'] = 'Last name is required.';
} elseif (strLenSafe($lastName) < 2 || strLenSafe($lastName) > 50) {
    $errors['lastName'] = 'Last name must be between 2 and 50 characters.';
} elseif (!preg_match("/^[a-zA-Z\s\-']+$/", $lastName)) {
    $errors['lastName'] = 'Last name contains invalid characters.';
}

// Validate Email 
if (empty($email)) {
    $errors['email'] = 'Email address is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please provide a valid email address.';
}

// Validate Phone 
if (!empty($phone)) {
    if (!preg_match("/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.\/0-9]{6,15}$/", $phone)) {
        $errors['phone'] = 'Please provide a valid phone number format.';
    }
}

// Validate Comments 
if (empty($comments)) {
    $errors['comments'] = 'Comments are required.';
} elseif (strLenSafe($comments) < 5) {
    $errors['comments'] = 'Comments must be at least 5 characters long.';
} elseif (strLenSafe($comments) > 3000) {
    $errors['comments'] = 'Comments cannot exceed 3000 characters.';
}

// CSRF check
if (!empty($_SESSION['csrf_token']) && !empty($csrfToken)) {
    if (!hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        $errors['csrf'] = 'Invalid security token. Please refresh and try again.';
    }
}

// If validation errors exist, return 422 Unprocessable Entity
if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Please correct the highlighted errors and try again.',
        'errors'  => $errors
    ]);
    exit;
}

// Generate unique ID and timestamp
$submissionId = 'SUB-' . strtoupper(substr(uniqid(), -6)) . '-' . date('Ymd');
$timestamp = date('Y-m-d H:i:s');
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

// Prepare record to save
$submissionRecord = [
    'id'         => $submissionId,
    'timestamp'  => $timestamp,
    'firstName'  => $firstName,
    'lastName'   => $lastName,
    'fullName'   => $firstName . ' ' . $lastName,
    'email'      => $email,
    'phone'      => !empty($phone) ? $phone : 'Not provided',
    'comments'   => $comments,
    'clientIp'   => $clientIp,
    'userAgent'  => $userAgent
];

// Save to JSON file with file locking for concurrency safety
$allSubmissions = [];
if (file_exists($submissionsFile)) {
    $fileData = file_get_contents($submissionsFile);
    $allSubmissions = json_decode($fileData, true) ?: [];
}

array_unshift($allSubmissions, $submissionRecord); // Place latest on top

$saved = file_put_contents(
    $submissionsFile,
    json_encode($allSubmissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
    LOCK_EX
);

if ($saved === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save submission. Please try again later.'
    ]);
    exit;
}

// EMAIL DISPATCH SYSTEM
// 1. Auto-response email to the user
// 2. Admin notification email to designated administrators

$mailResults = [
    'userAutoResponse' => false,
    'adminNotification' => false
];

// Helper to log emails into data/mail_log.json
function logEmail($recipient, $subject, $body, $headers, $status) {
    global $mailLogFile;
    $logEntry = [
        'id'        => uniqid('mail_', true),
        'timestamp' => date('Y-m-d H:i:s'),
        'to'        => $recipient,
        'subject'   => $subject,
        'headers'   => $headers,
        'body'      => $body,
        'status'    => $status ? 'sent' : 'logged_locally'
    ];
    $logs = [];
    if (file_exists($mailLogFile)) {
        $data = file_get_contents($mailLogFile);
        $logs = json_decode($data, true) ?: [];
    }
    array_unshift($logs, $logEntry);
    file_put_contents($mailLogFile, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

// Common headers for HTML email delivery
$fromEmail = 'noreply@tvhub-movies.com';
$headersCommon  = "MIME-Version: 1.0\r\n";
$headersCommon .= "Content-Type: text/html; charset=UTF-8\r\n";
$headersCommon .= "From: TVHUB Cinema Hub <" . $fromEmail . ">\r\n";
$headersCommon .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// USER AUTO-RESPONSE EMAIL
$userSubject = "Thank you for contacting TVHUB Movie Hub - Reference: " . $submissionId;
$userBody = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>' . htmlspecialchars($userSubject) . '</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; background-color: #0f1115; color: #f0f0f0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1a1d24; border-radius: 8px; overflow: hidden; border: 1px solid #2e3440; }
    .header { background: linear-gradient(135deg, #11141a, #1f2530); padding: 30px 25px; text-align: center; border-bottom: 2px solid #E5A900; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: #E5A900; margin: 5px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 30px 25px; line-height: 1.6; color: #cccccc; }
    .content h2 { color: #ffffff; font-size: 18px; margin-top: 0; }
    .summary-card { background-color: #12141a; border-radius: 6px; padding: 18px; margin: 20px 0; border-left: 4px solid #E5A900; }
    .summary-row { margin-bottom: 10px; font-size: 14px; }
    .summary-label { color: #8892b0; font-weight: 600; width: 120px; display: inline-block; }
    .summary-value { color: #ffffff; }
    .footer { background-color: #11141a; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #252a36; }
    .footer a { color: #E5A900; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TVHUB CINEMA HUB</h1>
      <p>Movie Library &amp; Customer Support</p>
    </div>
    <div class="content">
      <h2>Hello ' . htmlspecialchars($firstName) . ',</h2>
      <p>Thank you for reaching out to TVHUB Movie Hub. We have received your inquiry and our guest support team is currently reviewing your message.</p>
      
      <div class="summary-card">
        <div class="summary-row"><span class="summary-label">Reference ID:</span><span class="summary-value">' . htmlspecialchars($submissionId) . '</span></div>
        <div class="summary-row"><span class="summary-label">Date:</span><span class="summary-value">' . htmlspecialchars($timestamp) . '</span></div>
        <div class="summary-row"><span class="summary-label">Your Name:</span><span class="summary-value">' . htmlspecialchars($firstName . ' ' . $lastName) . '</span></div>
        <div class="summary-row"><span class="summary-label">Email:</span><span class="summary-value">' . htmlspecialchars($email) . '</span></div>
        <div class="summary-row"><span class="summary-label">Telephone:</span><span class="summary-value">' . htmlspecialchars($phone ?: 'None') . '</span></div>
        <div class="summary-row" style="margin-top: 15px;">
          <span class="summary-label" style="display: block; margin-bottom: 5px;">Your Message:</span>
          <div style="background: #1a1e28; padding: 12px; border-radius: 4px; color: #e2e8f0; font-style: italic;">
            "' . nl2br(htmlspecialchars($comments)) . '"
          </div>
        </div>
      </div>

      <p>One of our team members will respond to you within 24 business hours. If your request is urgent regarding ticket bookings or screening schedules, feel free to call us at <strong>+94 11 278 6991</strong>.</p>
      
      <p>Warm regards,<br>
      <strong>TVHUB Guest Experience Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ' . date('Y') . ' TVHUB Movie Hub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
';

$userHeaders = $headersCommon . "Reply-To: support@tvhub-movies.com\r\n";
// Suppress warnings in case local mail daemon is unconfigured
$sentUser = @mail($email, $userSubject, $userBody, $userHeaders);
logEmail($email, $userSubject, $userBody, $userHeaders, $sentUser);
$mailResults['userAutoResponse'] = true;


// ADMIN NOTIFICATION EMAIL
$adminSubject = "[New Contact Submission] " . $firstName . " " . $lastName . " - Ref: " . $submissionId;

foreach ($adminEmails as $adminEmail) {
    $adminBody = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>' . htmlspecialchars($adminSubject) . '</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f4f6f8; color: #333333; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; }
    .header { background: #11141a; color: #ffffff; padding: 25px; border-bottom: 4px solid #E5A900; }
    .header h2 { margin: 0; font-size: 20px; color: #E5A900; }
    .header p { margin: 5px 0 0; color: #a0aec0; font-size: 13px; }
    .content { padding: 25px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #edf2f7; font-size: 14px; }
    th { width: 30%; background-color: #f7fafc; color: #4a5568; font-weight: 600; }
    td { color: #2d3748; }
    .badge { display: inline-block; padding: 4px 10px; background: #e2e8f0; border-radius: 4px; font-weight: 600; font-size: 12px; }
    .comments-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-top: 15px; font-size: 14px; line-height: 1.6; color: #1a202c; }
    .footer { background: #edf2f7; padding: 15px 25px; text-align: center; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Website Contact Form Submission</h2>
      <p>Captured via TVHUB Movie Library Portal</p>
    </div>
    <div class="content">
      <p>A new visitor has submitted the contact form on your website. Full captured details are below:</p>
      
      <table>
        <tr>
          <th>Submission ID</th>
          <td><span class="badge">' . htmlspecialchars($submissionId) . '</span></td>
        </tr>
        <tr>
          <th>Submitted At</th>
          <td>' . htmlspecialchars($timestamp) . '</td>
        </tr>
        <tr>
          <th>Full Name</th>
          <td><strong>' . htmlspecialchars($firstName . ' ' . $lastName) . '</strong></td>
        </tr>
        <tr>
          <th>Email Address</th>
          <td><a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a></td>
        </tr>
        <tr>
          <th>Telephone</th>
          <td>' . (!empty($phone) ? '<a href="tel:' . htmlspecialchars($phone) . '">' . htmlspecialchars($phone) . '</a>' : '<em>Not provided</em>') . '</td>
        </tr>
        <tr>
          <th>IP Address</th>
          <td>' . htmlspecialchars($clientIp) . '</td>
        </tr>
        <tr>
          <th>User Agent</th>
          <td><small>' . htmlspecialchars($userAgent) . '</small></td>
        </tr>
      </table>

      <h3 style="margin-top: 25px; margin-bottom: 8px; color: #2d3748; font-size: 15px;">Comments / Message Content:</h3>
      <div class="comments-box">
        ' . nl2br(htmlspecialchars($comments)) . '
      </div>

      <div style="margin-top: 25px; text-align: center;">
        <a href="mailto:' . htmlspecialchars($email) . '?subject=Re: ' . urlencode('Inquiry ' . $submissionId) . '" style="background: #E5A900; color: #000000; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 4px; display: inline-block;">Reply Directly to Guest</a>
      </div>
    </div>
    <div class="footer">
      This is an automated administrative notification dispatched to <strong>' . htmlspecialchars($adminEmail) . '</strong>.
    </div>
  </div>
</body>
</html>
';

    $adminHeaders = $headersCommon . "Reply-To: " . $email . "\r\n";
    $sentAdmin = @mail($adminEmail, $adminSubject, $adminBody, $adminHeaders);
    logEmail($adminEmail, $adminSubject, $adminBody, $adminHeaders, $sentAdmin);
}
$mailResults['adminNotification'] = true;

// Return successful JSON response
echo json_encode([
    'success' => true,
    'message' => 'Thank you, ' . htmlspecialchars($firstName) . '! Your message has been sent successfully.',
    'data'    => [
        'submissionId' => $submissionId,
        'timestamp'    => $timestamp,
        'emailsSent'   => [
            'autoResponse' => $mailResults['userAutoResponse'],
            'adminNotification' => $mailResults['adminNotification'],
            'adminTargets' => $adminEmails
        ]
    ]
]);
exit;
