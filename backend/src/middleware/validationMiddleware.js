const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email_and_password_required" });
  }
  return next();
};

module.exports = {
  validateLogin,
};
