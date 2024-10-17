const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/tasks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tasks");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tasks", async (req, res) => {
  const {
    title,
    description,
    due_date,
    due_time,
    status,
    assignee_id,
    attachment_name,
    labels,
    creator_id,
  } = req.body;

  const sql = `
    INSERT INTO tasks (
      title, description, due_date, due_time, status, 
      assignee_id, attachment_name, labels, creator_id
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING *
  `;

  try {
    console.log("Received task data:", req.body);
    const result = await db.query(sql, [
      title,
      description,
      due_date,
      due_time,
      status || "pending",
      assignee_id,
      attachment_name,
      labels,
      creator_id,
    ]);
    console.log("Task created:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(400).json({ error: err.message });
  }
});

// Update task status
router.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE tasks
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;

  try {
    const result = await db.query(sql, [status, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;
