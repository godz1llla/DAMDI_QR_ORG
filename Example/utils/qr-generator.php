<?php

/**
 * Локальный генератор QR-кодов
 * Использует библиотеку phpqrcode (qr_library.php)
 */

// Подключаем библиотеку
require_once __DIR__ . '/qr_library.php';

class QRGenerator {
    
    /**
     * Генерирует QR-код и возвращает содержимое изображения
     * 
     * @param string $data Данные для QR-кода
     * @param int $size Размер QR-кода в пикселях (по умолчанию 300)
     * @return string|false Содержимое PNG изображения или false при ошибке
     */
    public static function generate($data, $size = 300) {
        try {
            // Используем буферизацию для получения изображения
            ob_start();
            // QRcode::png(данные, файл, уровень_коррекции, размер_точки, отступ)
            QRcode::png($data, false, QR_ECLEVEL_H, 10, 2);
            $imageData = ob_get_clean();
            
            if ($imageData && strlen($imageData) > 0) {
                return $imageData;
            }
            
            throw new Exception('QR generation returned empty result');
            
        } catch (Exception $e) {
            error_log("QR Generation Error: " . $e->getMessage());
            return false;
        }
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

