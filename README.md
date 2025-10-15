# Construir imágenes
docker-compose build
# Levantar servicios
docker-compose up -d
# Ver logs de todos los servicios
docker-compose logs -f
# Ver logs de un servicio específico
docker-compose logs -f backend
# Detener servicios
docker-compose down
# Detener Y eliminar volúmenes
docker-compose down -v
# Ver estado de servicios
docker-compose ps
# Ejecutar comando en contenedor
docker-compose exec backend sh


============


# TODO App - Sistema de Gestión de Tareas

## Descripción
Aplicación web simple para gestionar tareas (to-do) con **CRUD completo**:
- Crear nuevas tareas.
- Leer/listar tareas existentes.
- Actualizar (marcar/desmarcar como completadas y editar el título).
- Eliminar tareas.

La app se compone de **tres servicios** (Base de Datos, API y Frontend) y se implanta con **Docker Compose**.

---

## Arquitectura
**3 servicios en contenedores:**
- **db**: PostgreSQL 15-alpine con volumen persistente (`pgdata`).
- **backend**: API REST en Node.js + Express. Realiza la **migración automática** de la tabla `tasks` al iniciar y expone `/health` y `/tasks`.
- **frontend**: Nginx sirviendo HTML/CSS/JS que consumen la API.

**Puertos**
- DB: `5432:5432`
- Backend: `3000:3000`
- Frontend: `8080:80`

**Persistencia**
- Volumen `pgdata` montado en `/var/lib/postgresql/data`.

Diagrama (texto):
[Browser] ⇄ http://localhost:8080  →  [Nginx: frontend]
                               ↘
                                →  http://localhost:3000  →  [Express: backend]  →  [PostgreSQL: db (+volumen)]

---

## Tecnologías
- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** HTML + CSS + JavaScript + Nginx
- **Orquestación:** Docker + Docker Compose

---

## Requisitos Previos
- Docker **20+**
- Docker Compose **2+**
- Git


---


## Instalación y Ejecución


### 1. Clonar repositorio
git clone https://github.com/ArmandoH117/todo-app.git
cd todo-app
npm install (instalacion de node_modules)

### 2. Levantar servicios
docker compose build
docker compose up -d
docker compose ps

### 3. Acceder a la aplicación
- Backend (health): http://localhost:3000/health
- Frontend (UI): http://localhost:8080/

---

## Comandos Útiles

# Ciclo básico
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend    # o db / frontend

# Reiniciar servicios
docker compose restart backend
docker compose restart db

# Parar / eliminar
docker compose down            # detiene y elimina contenedores/red
docker compose down -v         # + elimina volúmenes (¡borra datos!)


## Estructura del Proyecto
.
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile
│  ├─ .env.example
│  └─ src/
│     └─ index.js
└─ frontend/
   ├─ Dockerfile
   ├─ nginx.conf
   └─ public/
      ├─ index.html
      ├─ styles.css
      └─ app.js

---

## API Endpoints

# Modelo `tasks`
# id SERIAL PRIMARY KEY
# title TEXT NOT NULL
# completed BOOLEAN NOT NULL DEFAULT false
# created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

# Salud
GET /health  ->  { "ok": true }

# CRUD
GET /tasks
# Devuelve lista de tareas

POST /tasks
# Body JSON:
# { "title": "Nueva tarea" }

PUT /tasks/:id
# Body JSON (cualquiera de los siguientes):
# { "completed": true }
# { "title": "Título editado" }
# { "title": "Título editado", "completed": false }

DELETE /tasks/:id

# Pruebas rápidas (curl)
curl http://localhost:3000/health

curl -X POST http://localhost:3000/tasks   -H "Content-Type: application/json"   -d '{"title":"Primera tarea"}'

curl http://localhost:3000/tasks

curl -X PUT http://localhost:3000/tasks/1   -H "Content-Type: application/json"   -d '{"completed": true}'

curl -X PUT http://localhost:3000/tasks/1   -H "Content-Type: application/json"   -d '{"title": "Primera tarea - editada"}'

curl -i -X DELETE http://localhost:3000/tasks/1

---

## Autores
- Jennifer Tatiana Guerra Figueroa
- Rodolfo Armando Hernandez Esquina

## Fecha
15/10/2025

---

## Enlace del Repositorio
https://github.com/ArmandoH117/todo-app.git
