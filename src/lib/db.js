import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "sql12.freesqldatabase.com",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "sql12837965",
  password: process.env.DB_PASSWORD || "jSrY4TFAyW",
  database: process.env.DB_NAME || "sql12837965",
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
};

const globalKey = "__mysql_pool__";
let pool = globalThis[globalKey];
export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    globalThis[globalKey] = pool;
  }
  return pool;
}

export const db = {
  query: async (...args) => {
    const p = getPool();
    return p.query(...args);
  },
  execute: async (...args) => {
    const p = getPool();
    return p.execute(...args);
  },
};
