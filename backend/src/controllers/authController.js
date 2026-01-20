const AuthOrchestrator = require("../services/AuthOrchestrator");
const { verifyToken } = require("../utils/jwt");

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthOrchestrator.login({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });

  if (!result.success) {
    return res.status(401).json({ error: result.reason });
  }

  return res.status(200).json({ token: result.token, user: result.user });
};

const validateToken = (req, res) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const payload = verifyToken(token);
    return res.status(200).json({ valid: true, payload });
  } catch (error) {
    return res.status(401).json({ error: "invalid_token" });
  }
};

const health = (req, res) => res.status(200).json({ status: "ok" });

module.exports = {
  login,
  validateToken,
  health,
};
