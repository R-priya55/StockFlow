const express = require("express");
const { signup, login, me, protect, getSettings, updateSettings } = require("../controllers/authController");

const router = express.Router();

// Signup and login are open to everyone
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// These need a logged-in user
router.get("/auth/me", protect, me);
router.get("/settings", protect, getSettings);
router.put("/settings", protect, updateSettings);

module.exports = router;