-- Migration: add foto_sakit_path to presensi table
ALTER TABLE presensi
ADD COLUMN foto_sakit_path VARCHAR(255) NULL AFTER foto_keluar_path;
