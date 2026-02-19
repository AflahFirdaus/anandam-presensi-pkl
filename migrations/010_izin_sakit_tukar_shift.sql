-- Migration: izin baru - Izin Sakit & Tukar Shift
-- Aturan: tidak masuk di tanggal_izin harus diganti di tanggal ganti (bisa banyak)

-- Tabel utama izin
CREATE TABLE IF NOT EXISTS izin (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  jenis_izin ENUM('SAKIT', 'TUKAR_SHIFT') NOT NULL,
  tanggal_izin DATE NOT NULL,
  alasan TEXT NOT NULL,
  foto_bukti VARCHAR(255) NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_izin_user_id ON izin(user_id);
CREATE INDEX idx_izin_status ON izin(status);
CREATE INDEX idx_izin_tanggal_izin ON izin(tanggal_izin);
CREATE INDEX idx_izin_jenis ON izin(jenis_izin);

-- Detail tanggal ganti (bisa banyak: 8 jam bisa dicicil beberapa hari)
CREATE TABLE IF NOT EXISTS izin_tanggal_ganti (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  izin_id BIGINT NOT NULL,
  tanggal_ganti DATE NOT NULL,
  jam_mulai TIME NULL,
  jam_selesai TIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (izin_id) REFERENCES izin(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_izin_tanggal_ganti_izin_id ON izin_tanggal_ganti(izin_id);

-- Hapus tabel lama (data lama tidak kompatibel dengan struktur baru)
DROP TABLE IF EXISTS izin_ganti_hari;
