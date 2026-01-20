const db = require("../config/database");

class User {
  static async findByEmail(email) {
    const result = await db.query(
      "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  }

  static async create({ email, passwordHash }) {
    const result = await db.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash, created_at, updated_at",
      [email, passwordHash]
    );
    return result.rows[0];
  }
}

module.exports = User;
