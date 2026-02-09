# Presensi PKL

Aplikasi presensi anak PKL berbasis web (Next.js App Router + MySQL).

## Fitur

- **Auth**: login dengan cookie httpOnly + session di DB
- **Role**: Admin (monitoring, set area/jam, kelola user) dan PKL (presensi masuk/pulang)
- **Presensi**: foto dari kamera (capture ke canvas) + lokasi geolocation, validasi radius & accuracy
- **Jam kerja**: admin set jam masuk/pulang; status TEPAT_WAKTU/TELAT (toleransi 15 menit), SESUAI/PULANG_CEPAT
- **Izin Sakit**: wajib upload bukti foto surat dokter saat presensi sakit, kamera otomatis menggunakan kamera belakang

## Setup

1. **Environment**

   Salin `.env.example` ke `.env` dan isi koneksi MySQL:

   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=...
   DB_NAME=presensi_pkl
   SESSION_COOKIE_NAME=presensi_session
   ```

2. **Database**

   Buat database `presensi_pkl`, lalu jalankan **semua** migration berurutan (wajib agar presensi & pengaturan hari libur jalan):

   - `migrations/001_create_users_sessions.sql`
   - `migrations/002_create_settings.sql`
   - `migrations/003_create_presensi.sql`
   - `migrations/004_add_shift_settings.sql`
   - `migrations/005_add_status_kehadiran.sql`
   - `migrations/006_add_total_jam_kerja.sql`
   - `migrations/007_add_force_holiday.sql`
   - `migrations/008_add_foto_sakit.sql`

   Jangan rename/delete file migration setelah di-push. Jika presensi/settings tidak tersimpan, pastikan migration 004–008 sudah dijalankan.

3. **Seed admin (opsional)**

   Untuk membuat user admin pertama (username: `admin`, password: `admin123`):

   ```bash
   node scripts/seed-admin.js
   ```

4. **Jalankan**

   ```bash
   pnpm install
   pnpm dev
   ```

   Buka [http://localhost:3000](http://localhost:3000). Login sebagai admin, lalu atur **Settings** (area lat/lng, radius, jam masuk/pulang) dan tambah user PKL di **User**.

## Endpoint API

- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/me` — user saat ini
- `GET /api/settings` — area + jam (untuk presensi)
- `PUT /api/admin/settings` — admin update area + jam
- `GET /api/presensi/today` — presensi hari ini (PKL)
- `POST /api/presensi/in` — presensi masuk (PKL) - foto wajib
- `POST /api/presensi/out` — presensi pulang (PKL) - foto wajib
- `GET /api/admin/presensi?date=YYYY-MM-DD` — daftar presensi per tanggal (admin)
- `GET /api/admin/users` — daftar user (admin)
- `POST /api/admin/users` — tambah user (admin)
- `PUT /api/admin/users/[id]` — update user (admin)
