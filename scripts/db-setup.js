const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function main() {
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const dbName = process.env.DB_NAME || "todo_app";

  const adminConnection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    multipleStatements: true,
    timezone: "Z"
  });

  await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await adminConnection.end();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: dbName,
    multipleStatements: true,
    timezone: "Z"
  });

  await connection.query(sql);
  await connection.end();
  console.log("Database schema is ready.");
}

main().catch((err) => {
  console.error("DB setup failed", err);
  process.exit(1);
});
