-- Migration: presensi
-- Jangan rename/delete file ini setelah di-push.

CREATE TABLE IF NOT EXISTS presensi (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  tanggal DATE NOT NULL,
  jam_masuk DATETIME NULL,
  jam_keluar DATETIME NULL,
  foto_masuk_path VARCHAR(255) NULL,
  foto_keluar_path VARCHAR(255) NULL,
  masuk_lat DECIMAL(10,7) NULL,
  masuk_lng DECIMAL(10,7) NULL,
  masuk_accuracy INT NULL,
  masuk_distance_m INT NULL,
  masuk_status ENUM('TEPAT_WAKTU','TELAT') NULL,
  masuk_lokasi_valid TINYINT(1) NULL,
  keluar_lat DECIMAL(10,7) NULL,
  keluar_lng DECIMAL(10,7) NULL,
  keluar_accuracy INT NULL,
  keluar_distance_m INT NULL,
  keluar_status ENUM('SESUAI','PULANG_CEPAT') NULL,
  keluar_lokasi_valid TINYINT(1) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_tanggal (user_id, tanggal),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
