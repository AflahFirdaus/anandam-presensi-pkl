-- Migration: add izin_ganti_hari table
-- Description: Create table for izin ganti hari (change day leave)

CREATE TABLE IF NOT EXISTS izin_ganti_hari (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  tanggal_mulai DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  tanggal_selesai DATE NOT NULL,
  jam_selesai TIME NOT NULL,
  alasan TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  foto_bukti VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_izin_ganti_hari_user_id ON izin_ganti_hari(user_id);
CREATE INDEX idx_izin_ganti_hari_status ON izin_ganti_hari(status);
CREATE INDEX idx_izin_ganti_hari_tanggal ON izin_ganti_hari(tanggal_mulai);
