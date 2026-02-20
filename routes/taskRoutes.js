const express = require("express");
const pool = require("../db");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
      [req.session.userId]
    );
    const tasks = rows.map((row) => ({
      id: row.id,
      title: row.title,
      completed: Boolean(row.completed),
      createdAt: row.created_at
    }));
    return res.json(tasks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { title } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  try {
    const trimmed = title.trim();
    const [result] = await pool.query(
      "INSERT INTO tasks (user_id, title, completed) VALUES (?, ?, 0)",
      [req.session.userId, trimmed]
    );
    return res.status(201).json({
      id: result.insertId,
      title: trimmed,
      completed: false
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  const { title, completed } = req.body || {};
  if (title === undefined && completed === undefined) {
    return res.status(400).json({ message: "Nothing to update." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, title, completed FROM tasks WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const current = rows[0];
    const nextTitle = title !== undefined ? String(title).trim() : current.title;
    if (!nextTitle) {
      return res.status(400).json({ message: "Title is required." });
    }
    const nextCompleted = completed !== undefined ? Boolean(completed) : Boolean(current.completed);

    await pool.query(
      "UPDATE tasks SET title = ?, completed = ? WHERE id = ? AND user_id = ?",
      [nextTitle, nextCompleted ? 1 : 0, req.params.id, req.session.userId]
    );

    return res.json({
      id: Number(req.params.id),
      title: nextTitle,
      completed: nextCompleted
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
