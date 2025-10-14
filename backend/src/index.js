const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 3000;

const dbCfg = {
  host: process.env.DB_HOST ?? process.env.PGHOST ?? "db",
  port: Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432),
  database: process.env.DB_NAME ?? process.env.PGDATABASE ?? "todo_db",
  user: process.env.DB_USER ?? process.env.PGUSER ?? "postgres",
  password: process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? "postgres",
};

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool(dbCfg);

const app = express();
app.use(cors());
app.use(express.json());

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/tasks", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC"
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title es requerido" });
    }
    const { rows } = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, completed, created_at",
      [title.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id inválido" });

    const { title, completed } = req.body || {};
    if (title === undefined && completed === undefined) {
      return res.status(400).json({ error: "debe enviar title y/o completed" });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) return res.status(400).json({ error: "title no puede estar vacío" });
      fields.push(`title = $${i++}`);
      values.push(t);
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ error: "completed debe ser boolean" });
      }
      fields.push(`completed = $${i++}`);
      values.push(completed);
    }

    values.push(id);
    const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${i} RETURNING id, title, completed, created_at`;
    const { rowCount, rows } = await pool.query(sql, values);

    if (!rowCount) return res.status(404).json({ error: "No existe la tarea" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id inválido" });

    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "No existe la tarea" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

