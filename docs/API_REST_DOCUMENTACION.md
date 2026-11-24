# Documentación Oficial de la API REST (`/api/v1`)
**Proyecto:** Custodia.Space — Sistema de Gestión y Custodia de Objetos Perdidos  
**Institución:** SENA Regional Huila · Centro de la Industria, la Empresa y los Servicios (CIES Neiva)  
**Programa / Ficha:** Análisis y Desarrollo de Software (ADSO) · Ficha `3413988`  
**URL Base:** `http://localhost:5173/api/v1`  
**Formato:** `application/json` (UTF-8)

---

## 1. Autenticación mediante Bearer Token (JWT)
Todos los endpoints protegidos requieren enviar la cabecera HTTP:
```http
Authorization: Bearer <JWT_TOKEN>
```
El token se obtiene mediante `POST /api/v1/auth/login` o `POST /api/v1/auth/register` y está firmado con **HMAC-SHA256** con una vigencia de **8 horas**.

---

## 2. Endpoints de Autenticación y Sesión

### `POST /api/v1/auth/login`
Autentica a un usuario registrado en MySQL (`custodia_sena_db.usuarios`) y emite su Token JWT junto con la lista de permisos RBAC.
- **Acceso:** Público
- **Body (JSON):**
  ```json
  {
    "email": "admin.custodia@sena.edu.co",
    "password": "admin123"
  }
  ```
- **Respuesta `200 OK`:**
  ```json
  {
    "ok": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "8h",
    "permissions": ["items:read:full", "items:write", "users:edit_role"],
    "user": { "id": "user-admin-1", "name": "Cap. Hernann Manchola B.", "role": "admin" }
  }
  ```
- **Errores:** `401 Unauthorized` (correo no encontrado o contraseña incorrecta), `403 Forbidden` (usuario `INACTIVO`).

---

### `POST /api/v1/auth/register`
Registra una nueva cuenta ciudadana. **Por regla de seguridad en el servidor, el rol inicial siempre se asigna como `user` (Cliente).**
- **Acceso:** Público
- **Body (JSON):**
  ```json
  {
    "name": "Laura Sofía Gómez",
    "email": "laura.gomez@misena.edu.co",
    "password": "miClave2026",
    "phone": "+57 315 000 1122",
    "idNumber": "1075300991"
  }
  ```
- **Respuesta `201 Created`:** Retorna el usuario creado con `role: "user"` y su Token JWT.
- **Errores:** `400 Bad Request` (campos faltantes), `409 Conflict` (correo duplicado).

---

### `GET /api/v1/auth/me`
Valida la firma y vigencia del Token JWT actual y retorna los permisos activos del usuario.
- **Acceso:** Autenticado (`user` | `employee` | `admin`)
- **Respuesta `200 OK`:** Payload decodificado del JWT y arreglo `permissions`.
- **Errores:** `401 Unauthorized`.

---

## 3. Endpoints de Objetos en Custodia (`objetos_custodia`)

| Método | Ruta | Descripción | Roles Autorizados |
|---|---|---|---|
| `GET` | `/api/v1/items/public` | Catálogo público (oculta respuestas de seguridad y seriales). | Público |
| `GET` | `/api/v1/items` | Lista completa de expedientes en custodia (incluye historial SHA-256). | `employee`, `admin` |
| `GET` | `/api/v1/items/:id` | Obtiene el detalle completo de un objeto por ID o código `SOP-...`. | `employee`, `admin` |
| `POST` | `/api/v1/items` | **CRUD CREATE:** Registra un nuevo objeto hallado en bóveda y casillero. | `employee`, `admin` |
| `PUT` | `/api/v1/items/:id` | **CRUD UPDATE:** Actualiza datos, casillero, estado o pregunta clave. | `employee`, `admin` |
| `DELETE` | `/api/v1/items/:id` | **CRUD DELETE:** Elimina un objeto de la base de datos MySQL y `db.json`. | `employee`, `admin` |
| `POST` | `/api/v1/items/:id/claim-attempt` | Registra intento de validación de propiedad del cliente (bloquea al 4.º fallo solo a ese cliente). | `user`, `employee`, `admin` |

---

## 4. Endpoints de Reportes Ciudadanos (`reportes_ciudadanos`)

| Método | Ruta | Descripción | Roles Autorizados |
|---|---|---|---|
| `GET` | `/api/v1/reports` | Lista declaraciones de pérdida (`LOST`) y hallazgo (`FOUND`). | `user`, `employee`, `admin` |
| `POST` | `/api/v1/reports` | **CRUD CREATE:** Radica un nuevo reporte ciudadano. | `user`, `employee`, `admin` |
| `PUT` | `/api/v1/reports/:id` | **CRUD UPDATE:** Edita detalles o vincula coincidencia (`COINCIDENCIA_DETECTADA`). | `user`, `employee`, `admin` |
| `DELETE` | `/api/v1/reports/:id` | **CRUD DELETE:** Elimina un reporte ciudadano. | `user`, `employee`, `admin` |

---

## 5. Endpoints de Usuarios y Roles (`usuarios` — RF-02)

| Método | Ruta | Descripción | Roles Autorizados |
|---|---|---|---|
| `GET` | `/api/v1/users` | Lista todos los usuarios registrados y sus roles RBAC. | **Exclusivo `admin`** |
| `POST` | `/api/v1/users` | **CRUD CREATE:** Crea un funcionario o usuario asignando rol directo. | **Exclusivo `admin`** |
| `PUT` | `/api/v1/users/:id` | **CRUD UPDATE:** Edita rol (`user` ↔ `employee` ↔ `admin`), placa y estado. | **Exclusivo `admin`** |
| `DELETE` | `/api/v1/users/:id` | **CRUD DELETE:** Elimina un usuario (protege la cuenta en sesión). | **Exclusivo `admin`** |

---

## 6. Documentación OpenAPI en Vivo
- `GET /api/v1/docs` — Retorna el esquema estándar **OpenAPI 3.0** (`docs/openapi.json`).
