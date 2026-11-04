<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

/**
 * Returns a configured PDO connection to the `"hotel booking system"` database.
 * Automatically initializes the database and schema from database.sql if absent.
 */
function getDatabaseConnection(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $dbName = getenv('DB_NAME') ?: 'hotelbookingsystem';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbName);
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        // If database does not exist yet, connect to server root and run database.sql
        $serverDsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $host, $port);
        $pdo = new PDO($serverDsn, $user, $pass, $options);
        $sqlFile = __DIR__ . DIRECTORY_SEPARATOR . 'database.sql';
        if (is_readable($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            if ($sql !== false) {
                $pdo->exec($sql);
            }
        }
        $pdo->exec('USE `' . str_replace('`', '``', $dbName) . '`');
    }

    return $pdo;
}
