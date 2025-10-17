import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export const getDBConnection = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "db",
        port: Number(process.env.DB_PORT) || 3306, // ← add this line
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } catch (err) {
      console.error("❌ Failed to create MySQL pool:", err);
      throw err;
    }
  }
  return pool;
};
