import { db } from "../src/lib/db.js";

async function run() {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, email, role, phone, avatar, is_active, password_hash FROM users LIMIT 1"
    );
    console.log("Success:", rows);
  } catch (err) {
    console.log("Database Error:");
    console.log("Error object:", err);
    console.log("Error message:", err.message);
  }
}
run();
