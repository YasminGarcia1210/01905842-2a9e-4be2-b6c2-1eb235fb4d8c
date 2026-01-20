const express = require("express");
const authController = require("../controllers/authController");
const { validateLogin } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/validate-token", authController.validateToken);
router.get("/health", authController.health);

module.exports = router;
