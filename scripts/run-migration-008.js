const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function main() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "presensi_pkl",
    });

    const sqlPath = path.join(__dirname, "..", "migrations", "007_add_force_holiday.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing migration:", sqlPath);
    await pool.execute(sql);
    console.log("Migration successful.");
    pool.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
