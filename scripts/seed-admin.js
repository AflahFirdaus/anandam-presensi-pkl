/**
 * Jalankan setelah migrations: node scripts/seed-admin.js
 * Membuat user admin pertama jika belum ada (username: admin, password: admin123).
 * Memerlukan: npm install mysql2 bcryptjs (atau pnpm add mysql2 bcryptjs)
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "presensi_pkl",
  });
  const [rows] = await pool.execute("SELECT id FROM users WHERE username = ?", ["admin"]);
  if (rows.length) {
    console.log("User admin sudah ada.");
    pool.end();
    return;
  }
  const hash = await bcrypt.hash("admin123", 10);
  await pool.execute(
    "INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)",
    ["Administrator", "admin", hash, "ADMIN"]
  );
  console.log("User admin dibuat: username=admin, password=admin123");
  pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
