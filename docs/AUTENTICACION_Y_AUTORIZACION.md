# Guía de Autenticación y Autorización (JWT + RBAC)
**Proyecto:** Custodia.Space — Sistema de Objetos Perdidos SENA CIES Neiva  
**Ficha ADSO:** `3413988`

---

## 1. Arquitectura de Autenticación (JWT · HMAC-SHA256)

1. **Inicio de Sesión (`POST /api/v1/auth/login`)**:
   - El cliente envía `email` y `password` en formato JSON.
   - El servidor consulta la tabla `usuarios` de **MySQL XAMPP (`custodia_sena_db`)**.
   - Verifica que el estado sea `ACTIVO` y que la contraseña coincida.
   - Si es válido, firma un **JSON Web Token (JWT)** con algoritmo **HS256** (`crypto.createHmac('sha256', JWT_SECRET)`), compuesto por:
     - **Header:** `{ "alg": "HS256", "typ": "JWT" }`
     - **Payload:** `sub` (ID usuario), `name`, `email`, `role`, `permissions`, `iat`, `exp` (8 horas) e `iss` (`custodia.space.sena.edu.co`).
     - **Signature:** Firma criptográfica verificada en cada petición protegida.

2. **Registro Público (`POST /api/v1/auth/register`)**:
   - Todo usuario nuevo creado desde el apartado **"Crea tu cuenta"** recibe obligatoriamente el rol inicial **`user` (Cliente)** directamente en el servidor.
   - Ningún usuario puede auto-asignarse rol de `employee` ni `admin` desde el registro público.

3. **Almacenamiento y Cierre de Sesión**:
   - El cliente guarda el JWT en `localStorage` (`sop_sena_jwt_token_v1`) y lo adjunta automáticamente en cada solicitud mediante `Authorization: Bearer <token>`.
   - Al cerrar sesión (`restApi.logout()`), el token se revoca del navegador.

---

## 2. Matriz de Autorización Basada en Roles (RBAC)

| Permiso / Capacidad | Cliente (`user`) | Empleado (`employee`) | Administrador (`admin`) |
|---|:---:|:---:|:---:|
| Consultar catálogo público (`/api/v1/items/public`) | ✅ | ✅ | ✅ |
| Validar propiedad de objetos (límite 4 fallos individual) | ✅ | — | — |
| Radicar, editar y eliminar reportes propios | ✅ | ✅ | ✅ |
| Ver expedientes completos y preguntas clave (`/api/v1/items`) | ❌ `403` | ✅ | ✅ |
| Registrar, editar y eliminar objetos en custodia (`CRUD`) | ❌ `403` | ✅ | ✅ |
| Formalizar entrega con firma digital y abrir casilleros | ❌ `403` | ✅ | ✅ |
| Desbloquear intentos fallidos de un Cliente | ❌ `403` | ✅ | ✅ |
| Gestionar usuarios y editar roles (`RF-02` · `/api/v1/users`) | ❌ `403` | ❌ `403` | ✅ |
| Administrar consola de Base de Datos MySQL XAMPP | ❌ `403` | Lectura | Total |

---

## 3. Regla Especial de Bloqueo Individual al Cliente
- Cuando un cliente intenta reclamar un objeto desde el Portal del Cliente y no alcanza el **70%** de coincidencia, el intento se registra con su `userId` y `userEmail` en la tabla `intentos_fallidos_cliente`.
- Al alcanzar **4 intentos fallidos**, ese artículo queda bloqueado **únicamente para ese cliente específico**.
- Los demás clientes siguen viendo el objeto disponible, y el **Empleado de Custodia** nunca queda bloqueado ni pierde acceso de administración sobre el bien.

---

## 4. Cuentas Semilla de Prueba
| Rol | Correo | Contraseña |
|---|---|---|
| **Administrador** (`admin`) | `admin.custodia@sena.edu.co` | `admin123` |
| **Empleado** (`employee`) | `javier.pinto@sena.edu.co` | `sena123` |
| **Cliente** (`user`) | `carlos.medina@misena.edu.co` | `cliente123` |
