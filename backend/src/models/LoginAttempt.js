const db = require("../config/database");

class LoginAttempt {
  static async create({ userId, success, ipAddress, userAgent }) {
    const result = await db.query(
      "INSERT INTO login_attempts (user_id, success, ip_address, user_agent) VALUES ($1, $2, $3, $4) RETURNING id, user_id, success, ip_address, user_agent, created_at",
      [userId, success, ipAddress, userAgent]
    );
    return result.rows[0];
  }
}

module.exports = LoginAttempt;
