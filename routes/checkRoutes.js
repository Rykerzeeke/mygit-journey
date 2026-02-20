const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

function parseMonth(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, mon] = month.split("-").map(Number);
  if (mon < 1 || mon > 12) return null;
  return { year, mon };
}

router.get("/", async (req, res) => {
  const { month } = req.query;
  const parsed = parseMonth(month || "");
  if (!parsed) {
    return res.status(400).json({ message: "Invalid month format. Use YYYY-MM." });
  }

  const start = `${parsed.year}-${String(parsed.mon).padStart(2, "0")}-01`;
  const nextMonth = parsed.mon === 12 ? { y: parsed.year + 1, m: 1 } : { y: parsed.year, m: parsed.mon + 1 };
  const end = `${nextMonth.y}-${String(nextMonth.m).padStart(2, "0")}-01`;

  try {
    const [rows] = await pool.query(
      "SELECT task_id, check_date FROM task_checks WHERE user_id = ? AND check_date >= ? AND check_date < ?",
      [req.session.userId, start, end]
    );
    return res.json({ checks: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { taskId, date, checked } = req.body || {};
  if (!taskId || !date || typeof checked !== "boolean") {
    return res.status(400).json({ message: "taskId, date, and checked are required." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
  }

  try {
    const [tasks] = await pool.query(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.session.userId]
    );
    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (checked) {
      await pool.query(
        "INSERT IGNORE INTO task_checks (user_id, task_id, check_date) VALUES (?, ?, ?)",
        [req.session.userId, taskId, date]
      );
    } else {
      await pool.query(
        "DELETE FROM task_checks WHERE user_id = ? AND task_id = ? AND check_date = ?",
        [req.session.userId, taskId, date]
      );
    }

    return res.json({ message: "Saved" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
