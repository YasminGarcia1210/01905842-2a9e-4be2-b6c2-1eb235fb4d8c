const jwt = require("jsonwebtoken");

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || "change_me";
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || "change_me";
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};
