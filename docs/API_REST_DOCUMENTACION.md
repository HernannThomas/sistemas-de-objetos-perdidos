# Documentación Técnica Oficial de Endpoints — API REST (`/api/v1`)

- **Proyecto:** Sistema de Gestión, Custodia y Validación de Objetos Perdidos y Encontrados (*Custodia.Space*)
- **Integrante / Autor:** Hernann Thomas Manchola Bocanegra
- **Instructor:** Javier Pinto
- **Programa / Ficha:** Tecnólogo en Análisis y Desarrollo de Software (ADSO) · Ficha `3413988`
- **Institución:** Servicio Nacional de Aprendizaje — SENA · CIES Neiva, Regional Huila (2026)
- **URL Base:** `http://localhost:5173/api/v1`
- **Motor Relacional:** MySQL / MariaDB en XAMPP (`127.0.0.1:3306` · BD `custodia_sena_db`) + Respaldo local `database/db.json`
- **Estándar Abierto:** OpenAPI `3.0.3` (`GET /api/v1/docs`)

---

## 1. Esquema de Seguridad: Autenticación JWT y Autorización RBAC

Todos los endpoints protegidos requieren adjuntar el **Bearer Token JWT** firmado criptográficamente con **HMAC-SHA256 (`HS256`)** y vigencia de **8 horas**:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Matriz de Roles y Alcance RBAC

| Rol | Identificador | Permisos en Payload JWT | Alcance en la API REST |
|---|---|---|---|
| **Cliente / Ciudadano** | `user` | `items:read:public`, `items:claim_attempt`, `reports:read:own`, `reports:write` | Consulta catálogo público, gestiona reportes y valida reclamos (máximo **4 intentos fallidos por cliente** en cada objeto). Recibe `403` en custodia confidencial y usuarios. |
| **Empleado / Custodio** | `employee` | `items:read:full`, `items:write`, `items:deliver`, `items:unlock_client`, `reports:*`, `audit:read` | CRUD completo sobre Objetos en Custodia (`/api/v1/items`) y Reportes (`/api/v1/reports`). Recibe `403` en `/api/v1/users`. |
| **Administrador** | `admin` | Todos los permisos + `users:read`, `users:write`, `users:edit_role`, `database:manage` | Acceso total sin restricciones, incluyendo CRUD exclusivo sobre Usuarios y Roles (`/api/v1/users` — **RF-02**). |

---

## 2. Catálogo Maestro de los 20 Endpoints Implementados

| # | Método | Ruta | Operación CRUD | Acceso / Rol RBAC | Tabla MySQL |
|---|---|---|---|---|---|
| 01 | `POST` | `/api/v1/auth/login` | AUTH | Público | `usuarios` |
| 02 | `POST` | `/api/v1/auth/register` | CREATE | Público (fuerza `user`) | `usuarios` |
| 03 | `GET` | `/api/v1/auth/me` | READ | Autenticado (Todos) | Firma HMAC |
| 04 | `GET` | `/api/v1/items/public` | READ | Público | `objetos_custodia` |
| 05 | `GET` | `/api/v1/items` | READ | `employee`, `admin` | `objetos_custodia` |
| 06 | `GET` | `/api/v1/items/:id` | READ | `employee`, `admin` | `objetos_custodia` |
| 07 | `POST` | `/api/v1/items` | CREATE | `employee`, `admin` | `objetos_custodia` |
| 08 | `PUT` / `PATCH` | `/api/v1/items/:id` | UPDATE | `employee`, `admin` | `objetos_custodia` |
| 09 | `DELETE` | `/api/v1/items/:id` | DELETE | `employee`, `admin` | `objetos_custodia` |
| 10 | `POST` | `/api/v1/items/:id/claim-attempt` | CREATE | `user`, `employee`, `admin` | `intentos_fallidos_cliente` |
| 11 | `GET` | `/api/v1/reports` | READ | `user`, `employee`, `admin` | `reportes_ciudadanos` |
| 12 | `POST` | `/api/v1/reports` | CREATE | `user`, `employee`, `admin` | `reportes_ciudadanos` |
| 13 | `PUT` / `PATCH` | `/api/v1/reports/:id` | UPDATE | `user`, `employee`, `admin` | `reportes_ciudadanos` |
| 14 | `DELETE` | `/api/v1/reports/:id` | DELETE | `user`, `employee`, `admin` | `reportes_ciudadanos` |
| 15 | `GET` | `/api/v1/users` | READ | **Exclusivo `admin`** | `usuarios` |
| 16 | `POST` | `/api/v1/users` | CREATE | **Exclusivo `admin`** | `usuarios` |
| 17 | `PUT` / `PATCH` | `/api/v1/users/:id` | UPDATE | **Exclusivo `admin`** | `usuarios` |
| 18 | `DELETE` | `/api/v1/users/:id` | DELETE | **Exclusivo `admin`** | `usuarios` |
| 19 | `GET` | `/api/v1/docs` | READ | Público | `docs/openapi.json` |
| 20 | `GET` / `POST` | `/api/db` | SYNC | Sistema Interno | Todas las tablas |

---

## 3. Detalle Técnico por Módulo

### 3.1 Módulo de Autenticación (`/api/v1/auth`)

#### `01. POST /api/v1/auth/login`
- **Propósito:** Valida correo y contraseña en MySQL y emite el Token Bearer JWT (`HS256`, vigencia `8h`).
- **Body JSON:**
  ```json
  {
    "email": "admin.custodia@sena.edu.co",
    "password": "admin123"
  }
  ```
- **Respuestas:** `200 OK` (retorna `token`, `permissions`, `user`), `401 Unauthorized` (credenciales inválidas), `403 Forbidden` (cuenta `INACTIVO`).

#### `02. POST /api/v1/auth/register`
- **Propósito:** Registra un nuevo ciudadano forzando en el backend `role: "user"` (Cliente) e inicia su sesión.
- **Body JSON:**
  ```json
  {
    "name": "Laura Sofía Gómez",
    "email": "laura.gomez@misena.edu.co",
    "password": "miClave2026",
    "phone": "+57 315 000 1122",
    "idNumber": "1075300991"
  }
  ```
- **Respuestas:** `201 Created`, `400 Bad Request` (datos incompletos), `409 Conflict` (correo duplicado).

#### `03. GET /api/v1/auth/me`
- **Propósito:** Verifica integridad criptográfica y expiración del JWT actual.
- **Respuestas:** `200 OK` (`jwtPayload` + `permissions`), `401 Unauthorized`.

---

### 3.2 Módulo de Objetos en Custodia (`/api/v1/items`)

#### `04. GET /api/v1/items/public`
- **Propósito:** Catálogo ciudadano público. Oculta `serialNumber` y respuestas secretas `correctHint`.
- **Respuestas:** `200 OK` (`total`, `items`).

#### `05. GET /api/v1/items` y `06. GET /api/v1/items/:id`
- **Propósito:** Consulta confidencial completa del inventario o de un expediente específico (`SOP-2026-XXXX`).
- **Acceso:** `employee` | `admin`.
- **Respuestas:** `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### `07. POST /api/v1/items` (CRUD CREATE)
- **Propósito:** Registra un nuevo bien hallado en casillero de bóveda y lo inserta en `objetos_custodia`.
- **Body JSON mínimo:** `{ "title": "Calculadora Casio ClassWiz", "brand": "Casio", "category": "ACADEMICO", "color": "Negro" }`
- **Respuestas:** `201 Created`, `400 Bad Request` (faltan `title` o `brand`), `401`, `403`.

#### `08. PUT /api/v1/items/:id` (CRUD UPDATE — también acepta `PATCH`)
- **Propósito:** Actualiza atributos, reubica casillero, desbloquea intentos de un cliente o formaliza acta `ENTREGADO`.
- **Respuestas:** `200 OK`, `401`, `403`, `404 Not Found`.

#### `09. DELETE /api/v1/items/:id` (CRUD DELETE)
- **Propósito:** Elimina físicamente el objeto en MySQL (`ON DELETE CASCADE`) y en `database/db.json`.
- **Respuestas:** `200 OK` (`deletedId`), `401`, `403`, `404 Not Found`.

#### `10. POST /api/v1/items/:id/claim-attempt`
- **Propósito:** Registra un fallo de validación (`< 70%`) vinculado únicamente al `userId` / `email` del cliente en sesión. Al llegar a `4` fallos en ese objeto, retorna `"clientBlocked": true` solo para ese cliente.
- **Respuestas:** `200 OK` (`clientAttempts`, `clientBlocked`, `attempt`), `401`, `404`.

---

### 3.3 Módulo de Reportes Ciudadanos (`/api/v1/reports`)

- **`11. GET /api/v1/reports`** — Lista reportes `LOST` y `FOUND` (`200 OK`, `401`).
- **`12. POST /api/v1/reports`** — **CRUD CREATE:** Radica nuevo reporte con código `REP-2026-XXXX` (`201 Created`, `400` si faltan `title` o `fullName`, `401`).
- **`13. PUT /api/v1/reports/:id`** — **CRUD UPDATE:** Edita datos o enlaza `matchedItemId` con estado `COINCIDENCIA_DETECTADA` (`200 OK`, `401`, `404`).
- **`14. DELETE /api/v1/reports/:id`** — **CRUD DELETE:** Elimina reporte de MySQL y `db.json` (`200 OK`, `401`, `404`).

---

### 3.4 Módulo de Usuarios y Roles RBAC — RF-02 (`/api/v1/users`)

> **Acceso restringido exclusivamente al rol `admin`.** Los roles `employee` y `user` reciben `403 Forbidden`.

- **`15. GET /api/v1/users`** — **CRUD READ:** Nómina completa de usuarios sanitizada (`200 OK`, `401`, `403`).
- **`16. POST /api/v1/users`** — **CRUD CREATE:** Crea cuenta asignando rol (`admin`, `employee` o `user`) (`201 Created`, `400`, `403`).
- **`17. PUT /api/v1/users/:id`** — **CRUD UPDATE:** Cambia rol RBAC, placa o estado `ACTIVO`/`INACTIVO` (`200 OK`, `403`, `404`).
- **`18. DELETE /api/v1/users/:id`** — **CRUD DELETE:** Elimina usuario impidiendo borrar la propia cuenta en sesión (`200 OK`, `400` auto-eliminación bloqueada, `403`, `404`).

---

### 3.5 Módulo de Especificación OpenAPI y Sincronización BD

- **`19. GET /api/v1/docs`** — Sirve el esquema formal **OpenAPI 3.0.3** (`200 OK`).
- **`20. GET /api/db` y `POST /api/db`** — Sincronización completa de estado entre interfaz React, `database/db.json` y MySQL XAMPP (`custodia_sena_db`).
