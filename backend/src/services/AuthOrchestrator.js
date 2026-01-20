const CredentialValidator = require("./CredentialValidator");
const RulesManager = require("./RulesManager");
const LoginAttempt = require("../models/LoginAttempt");
const { signToken } = require("../utils/jwt");

class AuthOrchestrator {
  static async login({ email, password, ipAddress, userAgent }) {
    const ruleResult = RulesManager.evaluate();
    if (!ruleResult.allowed) {
      return { success: false, reason: "blocked" };
    }

    const user = await CredentialValidator.validate(email, password);
    const success = Boolean(user);

    await LoginAttempt.create({
      userId: user ? user.id : null,
      success,
      ipAddress,
      userAgent,
    });

    if (!user) {
      return { success: false, reason: "invalid_credentials" };
    }

    const token = signToken({ id: user.id, email: user.email });
    return { success: true, token, user: { id: user.id, email: user.email } };
  }
}

module.exports = AuthOrchestrator;
