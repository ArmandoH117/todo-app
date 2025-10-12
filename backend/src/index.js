const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

// Config DB: soporta DATABASE_URL o variables separadas
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE || "todo_db",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
    });

const app = express();
app.use(cors());
app.use(express.json());

// Crea tabla si no existe
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

// Healthcheck
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Listar tareas
app.get("/tasks", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, done, created_at FROM tasks ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear tarea
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title es requerido" });
    }
    const { rows } = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done, created_at",
      [title.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar tarea (title/done opcionales)
app.put("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, done } = req.body || {};

    // Construcción dinámica de SET
    const sets = [];
    const values = [];
    let idx = 1;

    if (typeof title === "string") {
      sets.push(`title = $${idx++}`);
      values.push(title.trim());
    }
    if (typeof done === "boolean") {
      sets.push(`done = $${idx++}`);
      values.push(done);
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, title, done, created_at`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No existe la tarea" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar tarea
app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "No existe la tarea" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Arranque
ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al preparar el esquema:", err);
    process.exit(1);
  });

