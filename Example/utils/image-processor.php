<?php

class ImageProcessor {
    private $uploadDir = '../uploads/';
    private $maxFileSize = 10485760;
    private $targetSize = 400000;
    private $allowedTypes = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp');
    
    public function __construct() {
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    public function processUpload($file) {
        if (!isset($file['error']) || is_array($file['error'])) {
            return array('success' => false, 'message' => 'Некорректный файл');
        }
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return array('success' => false, 'message' => 'Ошибка загрузки файла');
        }
        
        if ($file['size'] > $this->maxFileSize) {
            return array('success' => false, 'message' => 'Файл слишком большой');
        }
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $this->allowedTypes)) {
            return array('success' => false, 'message' => 'Недопустимый тип файла');
        }
        
        $image = null;
        switch($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = imagecreatefromjpeg($file['tmp_name']);
                break;
            case 'image/png':
                $image = imagecreatefrompng($file['tmp_name']);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($file['tmp_name']);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($file['tmp_name']);
                break;
        }
        
        if (!$image) {
            return array('success' => false, 'message' => 'Не удалось обработать изображение');
        }
        
        $width = imagesx($image);
        $height = imagesy($image);
        
        $maxWidth = 1200;
        $maxHeight = 1200;
        
        if ($width > $maxWidth || $height > $maxHeight) {
            $ratio = min($maxWidth / $width, $maxHeight / $height);
            $newWidth = intval($width * $ratio);
            $newHeight = intval($height * $ratio);
            
            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }
        
        $filename = uniqid('img_', true) . '.webp';
        $filepath = $this->uploadDir . $filename;
        
        $quality = 85;
        $success = false;
        
        while ($quality >= 60 && !$success) {
            imagewebp($image, $filepath, $quality);
            
            if (file_exists($filepath) && filesize($filepath) <= $this->targetSize) {
                $success = true;
            } else if (file_exists($filepath)) {
                unlink($filepath);
                $quality -= 5;
            } else {
                break;
            }
        }
        
        imagedestroy($image);
        
        if (!$success) {
            return array('success' => false, 'message' => 'Не удалось сжать изображение');
        }
        
        return array(
            'success' => true,
            'url' => '/uploads/' . $filename,
            'size' => filesize($filepath)
        );
    }
}

