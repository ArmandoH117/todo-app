const API = "http://localhost:3000";

const list = document.querySelector("#list");
const form = document.querySelector("#new-form");
const input = document.querySelector("#new-title");

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

async function loadTasks() {
  list.innerHTML = "<li>Cargando...</li>";
  try {
    const tasks = await fetchJSON(`${API}/tasks`);
    if (!tasks.length) {
      list.innerHTML = "<li>No hay tareas aún</li>";
      return;
    }
    list.innerHTML = "";
    for (const t of tasks) {
      const li = document.createElement("li");
      li.className = t.completed ? "done" : "";
      li.innerHTML = `
        <span>
          <input class="checkbox" type="checkbox" ${
            t.completed ? "checked" : ""
          } />
          <strong>#${t.id}</strong> <span class="title">${escapeHtml(
        t.title
      )}</span>
        </span>
        <span class="action">
          <button class="toggle">${
            t.completed ? "Desmarcar" : "Completar"
          }</button>
          <button class="edit">Editar</button>
          <button class="danger delete">Eliminar</button>
        </span>
      `;

      li.querySelector(".checkbox").onchange = async (ev) => {
        await fetchJSON(`${API}/tasks/${t.id}`, {
          method: "PUT",
          body: JSON.stringify({ completed: Boolean(ev.target.checked) }),
        });
        await loadTasks();
      };

      li.querySelector(".toggle").onclick = async () => {
        await fetchJSON(`${API}/tasks/${t.id}`, {
          method: "PUT",
          body: JSON.stringify({ completed: !t.completed }),
        });
        await loadTasks();
      };

      li.querySelector(".edit").onclick = async () => {
        const current = t.title;
        const next = prompt("Nuevo título:", current);
        if (next === null) return;
        const title = (next || "").trim();
        if (!title || title === current) return;
        await fetchJSON(`${API}/tasks/${t.id}`, {
          method: "PUT",
          body: JSON.stringify({ title }),
        });
        await loadTasks();
      };

      li.querySelector(".delete").onclick = async () => {
        await fetchJSON(`${API}/tasks/${t.id}`, { method: "DELETE" });
        await loadTasks();
      };

      list.appendChild(li);
    }
  } catch (e) {
    list.innerHTML = `<li>Error: ${escapeHtml(e.message)}</li>`;
  }
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const title = (input.value || "").trim();
  if (!title) return;
  await fetchJSON(`${API}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  input.value = "";
  await loadTasks();
};

function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        c
      ])
  );
}

loadTasks();
