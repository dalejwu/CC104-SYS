-- Database: `hotelbookingsystem`
-- Complete Schema & Initial Seed Data for Mostar City Heritage Hotel Booking System

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `hotelbookingsystem`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hotelbookingsystem`;

CREATE TABLE IF NOT EXISTS `suites` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `suite_code` VARCHAR(40) NOT NULL,
  `kicker` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `nightly_rate` DECIMAL(10, 2) NOT NULL,
  `pin_icon_url` VARCHAR(500) NOT NULL,
  `max_guests` TINYINT UNSIGNED NOT NULL DEFAULT 4,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_suites_code` (`suite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_ref` CHAR(36) NOT NULL,
  `suite_code` VARCHAR(40) NOT NULL,
  `guest_name` VARCHAR(120) NOT NULL,
  `guest_email` VARCHAR(160) NOT NULL,
  `check_in` DATE NOT NULL,
  `check_out` DATE NOT NULL,
  `guests` TINYINT UNSIGNED NOT NULL DEFAULT 2,
  `nights` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('Confirmed', 'Pending', 'Checked-In') NOT NULL DEFAULT 'Confirmed',
  `special_requests` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bookings_ref` (`booking_ref`),
  KEY `idx_bookings_suite` (`suite_code`),
  KEY `idx_bookings_status` (`status`),
  KEY `idx_bookings_dates` (`check_in`, `check_out`),
  CONSTRAINT `fk_bookings_suite`
    FOREIGN KEY (`suite_code`) REFERENCES `suites` (`suite_code`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `suites` (`suite_code`, `kicker`, `name`, `description`, `nightly_rate`, `pin_icon_url`, `max_guests`) VALUES
  ('stari-most', 'Bridge View · €240/nt', 'Stari Most Suite', 'Private stone terrace overlooking the Neretva arch with breakfast.', 240.00, 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png', 4),
  ('kujundziluk', 'Bazaar Wing · €185/nt', 'Kujundziluk Loft', 'Artisanal timber loft above the historic copper bazaar lane.', 185.00, 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png', 3),
  ('koski-suite', 'Penthouse · €310/nt', 'Koski Panorama Suite', 'Top-floor sanctuary with minaret and emerald river views.', 310.00, 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230448_825949c9-ccdb-4857-b4a6-e349eccc9010.png', 4),
  ('kajtaz-villa', 'Ottoman Villa · €275/nt', 'Kajtaz Courtyard', 'Preserved 16th-century residence with walled courtyard garden.', 275.00, 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230438_d526b8b6-8a2e-4e3b-9993-3908acae03a7.png', 6),
  ('neretva-studio', 'Riverfront · €150/nt', 'Neretva Cliff Studio', 'Quiet cliffside studio cantilevered above the emerald water.', 150.00, 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260730_230442_140bc25b-b165-4249-904a-f708bff6970e.png', 2)
ON DUPLICATE KEY UPDATE
  `kicker` = VALUES(`kicker`),
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `nightly_rate` = VALUES(`nightly_rate`),
  `pin_icon_url` = VALUES(`pin_icon_url`),
  `max_guests` = VALUES(`max_guests`);

INSERT INTO `bookings` (`booking_ref`, `suite_code`, `guest_name`, `guest_email`, `check_in`, `check_out`, `guests`, `nights`, `total_price`, `status`, `special_requests`) VALUES
  ('8f4b2c10-9a3e-4d21-b865-1029384756ab', 'stari-most', 'Elena Kovačević', 'elena.kovacevic@adriatic.hr', '2026-11-04', '2026-11-07', 2, 3, 720.00, 'Confirmed', 'River terrace breakfast at 08:30'),
  ('3c9e1a74-5b12-4f89-9123-abcdef012345', 'koski-suite', 'Lukas Novak', 'lukas.novak@vienna-mail.at', '2026-11-10', '2026-11-12', 2, 2, 620.00, 'Checked-In', 'Late check-in from Sarajevo train'),
  ('7d2a6f91-0e45-4c78-8901-567890abcdef', 'kajtaz-villa', 'Amira Hadžić', 'amira.hadzic@mostar-art.ba', '2026-11-15', '2026-11-17', 4, 2, 550.00, 'Pending', 'Courtyard tea setup for 4 guests')
ON DUPLICATE KEY UPDATE
  `guest_name` = VALUES(`guest_name`),
  `status` = VALUES(`status`);
