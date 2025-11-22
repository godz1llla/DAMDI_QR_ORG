<?php

class Database {
    private $host = 'localhost';
    private $db_name = 'infogok1_jklm';
    private $username = 'infogok1_jklm';
    private $password = 'Gabi2005@';
    private $conn = null;
    
    public function getConnection() {
        if ($this->conn === null) {
            try {
                $this->conn = new PDO(
                    "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                    $this->username,
                    $this->password,
                    array(
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    )
                );
            } catch(PDOException $e) {
                error_log("Connection Error: " . $e->getMessage());
                return null;
            }
        }
        
        return $this->conn;
    }
}

