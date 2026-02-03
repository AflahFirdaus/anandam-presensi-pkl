-- Migration: tambah pengaturan shift (jadwal jam masuk/pulang per tipe hari)
-- Jangan rename/delete file ini setelah di-push.

-- Kolom di settings: tipe jadwal hari ini + shift yang aktif (JSON array of { jam_masuk, jam_pulang })
ALTER TABLE settings
  ADD COLUMN schedule_type VARCHAR(20) NULL COMMENT 'WEEKDAY|SATURDAY|SUNDAY' AFTER jam_pulang,
  ADD COLUMN enabled_shifts JSON NULL COMMENT '[{"jam_masuk":"08:00","jam_pulang":"16:00"},...]' AFTER schedule_type;

-- Kolom di presensi: shift yang dipakai saat masuk (untuk validasi pulang)
ALTER TABLE presensi
  ADD COLUMN shift_jam_masuk VARCHAR(5) NULL AFTER jam_keluar,
  ADD COLUMN shift_jam_pulang VARCHAR(5) NULL AFTER shift_jam_masuk;
