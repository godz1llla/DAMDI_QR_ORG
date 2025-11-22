<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['role']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: /login.html');
        exit();
    }
}

function requireRole($allowedRoles) {
    requireLogin();
    
    if (!is_array($allowedRoles)) {
        $allowedRoles = array($allowedRoles);
    }
    
    if (!in_array($_SESSION['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(array('success' => false, 'message' => 'Доступ запрещён'));
        exit();
    }
}

function getUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return array(
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['email'],
        'role' => $_SESSION['role'],
        'restaurant_id' => $_SESSION['restaurant_id'] ?? null,
        'first_name' => $_SESSION['first_name'] ?? '',
        'last_name' => $_SESSION['last_name'] ?? ''
    );
}

function setUserSession($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['restaurant_id'] = $user['restaurant_id'];
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
}

function destroySession() {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
}

