const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function sanitizeUser(row) {
  return {
    id: row.id,
    username: row.username,
    phoneNumber: row.phone_number,
    telegramChatId: row.telegram_chat_id,
    isAdmin: Boolean(row.is_admin),
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at
  };
}

router.post("/register", async (req, res) => {
  const { username, password, phoneNumber, telegramChatId } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "User ID and password are required." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "User ID already taken." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedPhone = phoneNumber ? String(phoneNumber).trim() : "";
    const normalizedTelegram = telegramChatId ? String(telegramChatId).trim() : "";
    const [result] = await pool.query(
      "INSERT INTO users (username, password_hash, phone_number, telegram_chat_id, is_admin) VALUES (?, ?, ?, ?, 0)",
      [username, passwordHash, normalizedPhone, normalizedTelegram]
    );

    req.session.userId = result.insertId;
    return res.status(201).json({ message: "Registered", userId: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "User ID and password are required." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);
    req.session.userId = user.id;
    return res.json({ message: "Logged in" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    return res.json({ message: "Logged out" });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.session.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  const { phoneNumber, telegramChatId } = req.body || {};

  try {
    const normalizedPhone = phoneNumber ? String(phoneNumber).trim() : "";
    const normalizedTelegram = telegramChatId ? String(telegramChatId).trim() : "";
    await pool.query(
      "UPDATE users SET phone_number = ?, telegram_chat_id = ? WHERE id = ?",
      [normalizedPhone, normalizedTelegram, req.session.userId]
    );
    return res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
