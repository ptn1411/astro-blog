<?php

/**
 * GitHub OAuth Callback for DecapCMS
 * Author: Phạm Thành Nam
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// === CONFIG ===
$client_id = "Ov23liD9t7YNfpf1tS1f";
$client_secret = "524305df09b2dda8feed354ef6676e9fb8e546c9";
$redirect_uri = "https://server-message.bug.edu.vn/api/auth/callback.php";

if (!isset($_GET['code'])) {
  echo json_encode([
    "error" => "Missing ?code parameter",
    "hint"  => "GitHub should redirect here with ?code=...",
  ], JSON_PRETTY_PRINT);
  exit;
}

$code = $_GET['code'];

// --- Gửi yêu cầu tới GitHub để đổi code lấy access_token ---
$post_data = http_build_query([
  "client_id" => $client_id,
  "client_secret" => $client_secret,
  "code" => $code,
  "redirect_uri" => $redirect_uri,
]);

$opts = [
  "http" => [
    "method"  => "POST",
    "header"  => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
    "content" => $post_data,
  ],
];

$context = stream_context_create($opts);
$result = @file_get_contents("https://github.com/login/oauth/access_token", false, $context);

if ($result === FALSE) {
  http_response_code(500);
  echo json_encode(["error" => "Failed to contact GitHub API"]);
  exit;
}

// --- Trả token cho DecapCMS ---
echo $result;
exit;
