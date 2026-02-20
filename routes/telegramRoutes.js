const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function generateCode() {
  return crypto.randomBytes(6).toString("hex");
}

async function sendTelegramMessage(chatId, message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message
    });
  } catch (err) {
    console.error("Telegram send failed", err.response?.data || err.message);
  }
}

router.post("/link", requireAuth, async (req, res) => {
  try {
    const linkCode = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "INSERT INTO telegram_links (user_id, link_code, expires_at) VALUES (?, ?, ?)",
      [req.session.userId, linkCode, expiresAt]
    );

    return res.json({
      linkCode,
      expiresAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/status", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT telegram_chat_id FROM users WHERE id = ?",
      [req.session.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ linked: Boolean(rows[0].telegram_chat_id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/webhook/:secret", async (req, res) => {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || req.params.secret !== expected) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const message = req.body?.message;
  const text = message?.text || "";
  if (!message || !text.startsWith("/start ")) {
    return res.json({ ok: true });
  }

  const code = text.replace("/start", "").trim();
  if (!code) {
    return res.json({ ok: true });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, user_id, expires_at, used_at FROM telegram_links WHERE link_code = ?",
      [code]
    );

    if (rows.length === 0) {
      return res.json({ ok: true });
    }

    const link = rows[0];
    if (link.used_at) {
      return res.json({ ok: true });
    }

    const now = new Date();
    if (new Date(link.expires_at) < now) {
      return res.json({ ok: true });
    }

    const chatId = message.chat?.id ? String(message.chat.id) : null;
    if (!chatId) {
      return res.json({ ok: true });
    }

    await pool.query("UPDATE users SET telegram_chat_id = ? WHERE id = ?", [chatId, link.user_id]);
    await pool.query("UPDATE telegram_links SET used_at = ? WHERE id = ?", [now, link.id]);

    await sendTelegramMessage(chatId, "Telegram linked successfully. You will now receive check-in reminders.");

    return res.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
