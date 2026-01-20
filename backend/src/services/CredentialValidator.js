const User = require("../models/User");
const { comparePassword } = require("../utils/bcrypt");

class CredentialValidator {
  static async validate(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      return null;
    }

    const matches = await comparePassword(password, user.password_hash);
    if (!matches) {
      return null;
    }

    return user;
  }
}

module.exports = CredentialValidator;
