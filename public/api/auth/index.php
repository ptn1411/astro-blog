<?php

/**
 * Simple GitHub OAuth Proxy for DecapCMS
 * Author: Phạm Thành Nam
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

$client_id = "Ov23liD9t7YNfpf1tS1f";
$client_secret = "524305df09b2dda8feed354ef6676e9fb8e546c9";
$redirect_uri = "https://server-message.bug.edu.vn/admin/";

// Khi DecapCMS gọi /api/auth?code=... GitHub sẽ gửi code về đây
if (isset($_GET['code'])) {
  $code = $_GET['code'];

  $postdata = [
    "client_id" => $client_id,
    "client_secret" => $client_secret,
    "code" => $code,
    "redirect_uri" => $redirect_uri,
  ];

  $opts = [
    "http" => [
      "method"  => "POST",
      "header"  => "Content-Type: application/json\r\nAccept: application/json\r\n",
      "content" => json_encode($postdata),
    ],
  ];

  $context = stream_context_create($opts);
  $result = file_get_contents("https://github.com/login/oauth/access_token", false, $context);

  if ($result === FALSE) {
    echo json_encode(["error" => "Failed to get access token"]);
    exit;
  }

  echo $result;
  exit;
}

echo json_encode(["error" => "Missing ?code parameter"]);
