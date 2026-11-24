# Manual de Operaciones CRUD y Base de Datos MySQL (XAMPP)
**Proyecto:** Custodia.Space — Sistema de Objetos Perdidos SENA CIES Neiva  
**Base de Datos:** `custodia_sena_db` (`127.0.0.1:3306` · Usuario: `root`)

---

## 1. Resumen de Operaciones CRUD Implementadas

### A. Objetos en Custodia (`objetos_custodia`)
- **CREATE (`POST /api/v1/items`):** Botón **"Registrar Hallazgo"** en el encabezado o **"+ Crear Objeto (CRUD CREATE)"** en la pestaña Base de Datos. Valida fotografía ≤ 500 KB (RF-04), asigna código `SOP-2026-...`, precinto, tag RFID y casillero.
- **READ (`GET /api/v1/items` / `GET /api/v1/items/public`):** Galería horizontal pública, portal del cliente, matriz de 30 casilleros y buscador con filtros por estado y categoría.
- **UPDATE (`PUT /api/v1/items/:id`):** Botón **"Editar"** dentro de `ItemDetailView.tsx` para modificar título, categoría, marca, modelo, color, serie, valor, casillero, señas particulares y pregunta de seguridad (con registro automático en bitácora SHA-256).
- **DELETE (`DELETE /api/v1/items/:id`):** Botón **"Eliminar"** en `ItemDetailView.tsx` y botón **"DELETE"** en `DatabaseManagerView.tsx`. Elimina el registro en la interfaz, en `database/db.json` y en MySQL XAMPP.

### B. Reportes Ciudadanos (`reportes_ciudadanos`)
- **CREATE (`POST /api/v1/reports`):** Modal en el Portal del Cliente para declarar pérdida (`LOST`) o hallazgo (`FOUND`) con foto opcional ≤ 500 KB.
- **READ (`GET /api/v1/reports`):** Listado en tiempo real en el Portal del Cliente y módulo de cotejo para el Empleado.
- **UPDATE (`PUT /api/v1/reports/:id`):** Botón **"Editar"** en el panel del Empleado (modal completo con cambio de estado) y en el Portal del Cliente.
- **DELETE (`DELETE /api/v1/reports/:id`):** Botón **"Eliminar"** en el detalle de reportes de ambos portales.

### C. Usuarios y Roles RBAC (`usuarios` — RF-02)
- **CREATE (`POST /api/v1/auth/register` / `POST /api/v1/users`):** Registro público (rol inicial `user`) o creación directa por Administrador.
- **READ (`GET /api/v1/users`):** Directorio filtrable por rol exclusivo del Administrador.
- **UPDATE (`PUT /api/v1/users/:id`):** Selector rápido de rol en tabla y modal completo de edición de perfil y estado.
- **DELETE (`DELETE /api/v1/users/:id`):** Botón **"Eliminar"** en la tabla de usuarios (protegiendo al usuario administrador actualmente logueado).

---

## 2. Estructura de Base de Datos en XAMPP (`custodia_sena_db`)
Los archivos de base de datos se encuentran en la carpeta `database/`:
- `database/custodia_sena_xampp.sql`: Script completo listo para importar en **phpMyAdmin** (`http://localhost/phpmyadmin`).
- `database/schema.sql`: Esquema relacional DDL.
- `database/setup_xampp_mysql.mjs`: Provisionador automático desde Node.js (`node database/setup_xampp_mysql.mjs`).
- `database/db.json`: Respaldo JSON sincronizado automáticamente.
