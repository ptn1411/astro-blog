<?php

/**
 * GitHub OAuth Start
 * Author: Phạm Thành Nam
 */

$client_id = "Ov23liD9t7YNfpf1tS1f";
$redirect_uri = "https://server-message.bug.edu.vn/api/auth/callback.php";
$scope = "repo,user";

// Tạo URL đăng nhập GitHub OAuth
$auth_url = sprintf(
  "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=%s",
  urlencode($client_id),
  urlencode($redirect_uri),
  urlencode($scope)
);

// Chuyển hướng người dùng tới GitHub
header("Location: $auth_url");
exit;
