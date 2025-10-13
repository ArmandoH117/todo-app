const API = `http://localhost:3000`;

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
      li.className = t.done ? "done" : "";
      li.innerHTML = `
        <span>
          <input class="checkbox" type="checkbox" ${t.done ? "checked" : ""} />
          <strong>#${t.id}</strong> ${escapeHtml(t.title)}
        </span>
        <span class="action">
          <button class="toggle">${t.done ? "Desmarcar" : "Completar"}</button>
          <button class="danger delete">Eliminar</button>
        </span>
      `;

      li.querySelector(".toggle").onclick = async () => {
        await fetchJSON(`${API}/tasks/${t.id}`, {
          method: "PUT",
          body: JSON.stringify({ done: !t.done }),
        });
        await loadTasks();
      };

      li.querySelector(".delete").onclick = async () => {
        await fetchJSON(`${API}/tasks/${t.id}`, { method: "DELETE" });
        await loadTasks();
      };

      li.querySelector(".checkbox").onchange = async (ev) => {
        await fetchJSON(`${API}/tasks/${t.id}`, {
          method: "PUT",
          body: JSON.stringify({ done: ev.target.checked }),
        });
        await loadTasks();
      };

      list.appendChild(li);
    }
  } catch (e) {
    list.innerHTML = `<li>Error: ${e.message}</li>`;
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
