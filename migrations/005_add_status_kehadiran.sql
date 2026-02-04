-- Migration: add status_kehadiran to presensi table
ALTER TABLE presensi
ADD COLUMN status_kehadiran ENUM('HADIR', 'SAKIT', 'IZIN', 'ALPHA') NOT NULL DEFAULT 'HADIR' AFTER user_id;
