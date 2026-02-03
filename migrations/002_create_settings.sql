-- Migration: settings (1 row aktif)
-- Jangan rename/delete file ini setelah di-push.

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_name VARCHAR(100) NULL,
  area_lat DECIMAL(10,7) NULL,
  area_lng DECIMAL(10,7) NULL,
  area_radius_m INT NULL,
  jam_masuk TIME NULL,
  jam_pulang TIME NULL,
  updated_by BIGINT NULL,
  updated_at DATETIME NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
