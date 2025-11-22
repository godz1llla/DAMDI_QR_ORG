<?php
require_once '../../config/database.php';
require_once '../../config/session.php';
require_once '../../utils/qr-generator.php';

requireRole('ADMIN');

/**
 * Функция транслитерации для кириллицы
 */
function transliterate($text) {
    $rus = array('А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я', 'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я');
    $lat = array('A', 'B', 'V', 'G', 'D', 'E', 'E', 'Gh', 'Z', 'I', 'Y', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'F', 'H', 'C', 'Ch', 'Sh', 'Sch', '', 'Y', '', 'E', 'Yu', 'Ya', 'a', 'b', 'v', 'g', 'd', 'e', 'e', 'gh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'h', 'c', 'ch', 'sh', 'sch', '', 'y', '', 'e', 'yu', 'ya');
    return str_replace($rus, $lat, $text);
}

if (!isset($_GET['table_id'])) {
    http_response_code(400);
    die('Table ID required');
}

$user = getUser();
$restaurantId = $user['restaurant_id'];
$tableId = intval($_GET['table_id']);

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    die('Database connection error');
}

try {
    // Проверяем что столик принадлежит нашему ресторану
    $stmt = $db->prepare("
        SELECT t.*, r.name as restaurant_name
        FROM tables t
        JOIN restaurants r ON t.restaurant_id = r.id
        WHERE t.id = ? AND t.restaurant_id = ?
        LIMIT 1
    ");
    $stmt->execute(array($tableId, $restaurantId));
    $table = $stmt->fetch();
    
    if (!$table) {
        http_response_code(404);
        die('Table not found');
    }
    
    // Формируем URL для меню
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $menuUrl = "{$protocol}://{$host}/menu/client.html?restaurant_id={$restaurantId}&table_id={$tableId}";
    
    // Генерируем QR-код
    $qrImage = QRGenerator::generate($menuUrl, 400);
    
    if ($qrImage === false) {
        http_response_code(500);
        die('QR generation error');
    }
    
    // Создаём изображение с подписью
    $qr = imagecreatefromstring($qrImage);
    $qrWidth = imagesx($qr);
    $qrHeight = imagesy($qr);
    
    // Новое изображение с местом для текста
    $padding = 40;
    $textHeight = 80;
    $finalWidth = $qrWidth + ($padding * 2);
    $finalHeight = $qrHeight + $textHeight + ($padding * 2);
    
    $final = imagecreatetruecolor($finalWidth, $finalHeight);
    
    // Белый фон
    $white = imagecolorallocate($final, 255, 255, 255);
    $black = imagecolorallocate($final, 0, 0, 0);
    $orange = imagecolorallocate($final, 243, 115, 33);
    
    imagefilledrectangle($final, 0, 0, $finalWidth, $finalHeight, $white);
    
    // Копируем QR-код
    imagecopy($final, $qr, $padding, $padding, 0, 0, $qrWidth, $qrHeight);
    
    // Добавляем текст
    $restaurantName = $table['restaurant_name'];
    $tableNumber = $table['table_number'];
    
    // Название ресторана (транслитерируем кириллицу)
    $text1 = transliterate($restaurantName);
    $text1Width = imagefontwidth(5) * strlen($text1);
    $x1 = ($finalWidth - $text1Width) / 2;
    $y1 = $qrHeight + $padding + 20;
    imagestring($final, 5, $x1, $y1, $text1, $black);
    
    // Номер столика
    $text2 = "Stolik #" . $tableNumber;
    $text2Width = imagefontwidth(5) * strlen($text2);
    $x2 = ($finalWidth - $text2Width) / 2;
    $y2 = $y1 + 30;
    imagestring($final, 5, $x2, $y2, $text2, $orange);
    
    // Инструкция
    $text3 = "Scan to view menu";
    $text3Width = imagefontwidth(3) * strlen($text3);
    $x3 = ($finalWidth - $text3Width) / 2;
    $y3 = $y2 + 30;
    imagestring($final, 3, $x3, $y3, $text3, $black);
    
    // Отправляем заголовки
    header('Content-Type: image/png');
    header('Content-Disposition: attachment; filename="qr-table-' . $tableNumber . '.png"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Выводим изображение
    imagepng($final);
    
    // Очищаем память
    imagedestroy($qr);
    imagedestroy($final);
    
} catch(PDOException $e) {
    http_response_code(500);
    error_log("QR Generate Error: " . $e->getMessage());
    die('Server error');
}

