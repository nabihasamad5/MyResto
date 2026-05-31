import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "rms_db",
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
