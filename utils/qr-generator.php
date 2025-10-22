<?php

/**
 * Локальный генератор QR-кодов
 * Использует библиотеку phpqrcode (qrlib.php)
 * 
 * ВАЖНО: Для работы нужен файл qrlib.php в этой же папке
 * Скачайте его по инструкции в INSTALL-QRLIB.md
 */

// Проверяем наличие библиотеки
if (file_exists(__DIR__ . '/qrlib.php')) {
    require_once __DIR__ . '/qrlib.php';
    define('QRLIB_AVAILABLE', true);
} else {
    define('QRLIB_AVAILABLE', false);
}

class QRGenerator {
    
    /**
     * Генерирует QR-код и возвращает содержимое изображения
     * 
     * @param string $data Данные для QR-кода
     * @param int $size Размер QR-кода в пикселях (по умолчанию 300)
     * @return string|false Содержимое PNG изображения или false при ошибке
     */
    public static function generate($data, $size = 300) {
        // Если есть локальная библиотека - используем её
        if (QRLIB_AVAILABLE) {
            try {
                ob_start();
                QRcode::png($data, false, QR_ECLEVEL_L, 10, 2);
                $imageData = ob_get_clean();
                if ($imageData) {
                    return $imageData;
                }
            } catch (Exception $e) {
                error_log("QR Generation Error: " . $e->getMessage());
            }
        }
        
        // Fallback: используем Google Charts API
        $encodedData = urlencode($data);
        $url = "https://chart.googleapis.com/chart?cht=qr&chs={$size}x{$size}&chl={$encodedData}&choe=UTF-8";
        $imageData = @file_get_contents($url);
        
        if ($imageData === false) {
            // Если Google API тоже не доступен, создаём простое изображение
            return self::generateFallback($data, $size);
        }
        
        return $imageData;
    }
    
    /**
     * Генерирует QR-код и сохраняет в файл
     * 
     * @param string $data Данные для QR-кода
     * @param string $filename Путь к файлу для сохранения
     * @param int $size Размер QR-кода
     * @return bool Успешность операции
     */
    public static function generateToFile($data, $filename, $size = 300) {
        $imageData = self::generate($data, $size);
        
        if ($imageData === false) {
            return false;
        }
        
        return file_put_contents($filename, $imageData) !== false;
    }
    
    /**
     * Генерирует запасное изображение с текстом (если API недоступен)
     * 
     * @param string $data Данные
     * @param int $size Размер
     * @return string PNG изображение
     */
    private static function generateFallback($data, $size) {
        $image = imagecreatetruecolor($size, $size);
        
        // Белый фон
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        $gray = imagecolorallocate($image, 200, 200, 200);
        
        imagefilledrectangle($image, 0, 0, $size, $size, $white);
        
        // Рамка
        imagerectangle($image, 10, 10, $size - 10, $size - 10, $gray);
        
        // Текст
        $text = "QR Code";
        $fontSize = 5;
        $textWidth = imagefontwidth($fontSize) * strlen($text);
        $textHeight = imagefontheight($fontSize);
        $x = ($size - $textWidth) / 2;
        $y = ($size - $textHeight) / 2 - 20;
        
        imagestring($image, $fontSize, $x, $y, $text, $black);
        
        // URL (обрезанный)
        $shortUrl = substr($data, 0, 40);
        if (strlen($data) > 40) $shortUrl .= '...';
        
        $fontSize2 = 2;
        $urlWidth = imagefontwidth($fontSize2) * strlen($shortUrl);
        $x2 = ($size - $urlWidth) / 2;
        $y2 = $y + 40;
        
        imagestring($image, $fontSize2, $x2, $y2, $shortUrl, $gray);
        
        // Выводим в переменную
        ob_start();
        imagepng($image);
        $imageData = ob_get_clean();
        
        imagedestroy($image);
        
        return $imageData;
    }
    
    /**
     * Генерирует QR-код в формате Base64 Data URI
     * 
     * @param string $data Данные для QR-кода
     * @param int $size Размер
     * @return string Data URI
     */
    public static function generateDataUri($data, $size = 300) {
        $imageData = self::generate($data, $size);
        
        if ($imageData === false) {
            return '';
        }
        
        return 'data:image/png;base64,' . base64_encode($imageData);
    }
}

