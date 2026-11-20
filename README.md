# Sistema de Gestión, Custodia y Validación de Objetos Perdidos y Encontrados (SOP)

Proyecto desarrollado para el programa **Análisis y Desarrollo de Software (ADSO)** — **Ficha: 3413988**  
**Servicio Nacional de Aprendizaje (SENA)** — Regional Huila, CIES Neiva (2026).  
**Integrante:** Hernann Thomas Manchola Bocanegra  
**Instructores:** Javier Pinto / Carlos Fabián Martínez Mora  

---

## 🚀 Descripción General
Aplicación web moderna desarrollada en **React 19**, **TypeScript**, **Vite** y **Tailwind CSS**, diseñada bajo riguroso cumplimiento de la **Especificación de Requisitos de Software (SRS)** y el **Manual de Casos de Uso (CU-01 a CU-08)** del proyecto.

El sistema digitaliza de extremo a extremo la cadena de custodia de pertenencias extraviadas, eliminando bitácoras físicas y minimizando el riesgo de suplantación o doble entrega mediante un protocolo interactivo de validación presencial (umbral 70%–80%) y firma digitalizada.

---

## 📌 Correspondencia con Requisitos del SRS y Casos de Uso

| Módulo / Requisito | Código SRS | Caso de Uso | Funcionalidad Implementada |
|---|---|---|---|
| **Autenticación y RBAC** | RF-01 / RF-02 | CU-01 / CU-02 | Inicio de sesión y alternancia rápida entre **ROLE_ADMIN**, **ROLE_EMPLEADO** y **Portal Ciudadano**. |
| **Ingreso y Ubicación Física** | RF-03 | CU-03 | Registro de hallazgo con generación de código (`SOP-2026-XXXX`), precinto inviolable y casillero (Locker L-01 a L-24, Bandeja y Zona). |
| **Carga de Fotografía** | RF-04 | CU-03 | Carga con validación estricta de peso **≤ 500 KB**, vista previa y presets fotográficos de muestra. |
| **Catálogo y Buscador** | RF-06 / RF-07 | CU-04 | Búsqueda por tracking, marca, serial, casillero o titular con filtros por estado y categoría. |
| **Protocolo de Validación (70%-80%)** | RF-08 | CU-05 | Termómetro interactivo de cotejo presencial: Marca (15%), Modelo (15%), Color (10%), Señas (15%), Fecha (10%), Lugar (15%) y Pregunta de Seguridad (20%). |
| **Verificación Reforzada** | RF-09 | CU-05 | Clave de desbloqueo PIN/patrón en vivo, fondo de pantalla secreto o señas internas ocultas al público. |
| **Control de Intentos Fallidos** | RF-10 | CU-06 | Registro con nombre, cédula y motivo de personas no autorizadas que fallen el umbral. |
| **Bloqueo Automático (4to Intento)** | RF-11 | CU-06 | Al 4to intento fallido consecutivo, el estado pasa automáticamente a `BLOQUEADO_POR_SEGURIDAD`, disparando alarma sonora y bloqueando la entrega. |
| **Formalización y Firma Digital** | RF-12 | CU-07 | Acta oficial de entrega con firma manuscrita digitalizada en canvas HTML5, cédula y generación de hash de exoneración. |
| **Baja Lógica (Soft Delete)** | RF-13 | CU-07 | Pasa a `ENTREGADO`, se retira del catálogo activo y de la búsqueda ciudadana, preservando su trazabilidad histórica inmutable. |
| **Bitácora Inmutable (Ledger)** | RF-14 | CU-08 | Registro criptográfico con hashes SHA-256 de cada movimiento, exportable a JSON. |
| **Desbloqueo Administrativo** | RF-15 | CU-08 | Exclusivo para **ROLE_ADMIN**: requiere justificación administrativa y acta oficial para levantar medidas cautelares por sospecha de hurto. |
| **Portal Ciudadano** | Portal Público | Consulta Pública | Catálogo con protección de privacidad (sin seriales ni preguntas secretas expuestas) y formulario para radicar reportes de pérdida. |
| **Matriz de Casilleros** | Hardware UI | Gestión Física | Tablero visual de ocupación de casilleros L-01 a L-24 con simulación sonora de cerradura solenoide (Web Audio API). |

---

## 🛠️ Tecnologías Utilizadas
- **React 19** (`react`, `react-dom`)
- **TypeScript 5.7**
- **Vite 6**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Lucide React** (Iconografía técnica e institucional)
- **Motion** (Animaciones fluidas y transiciones de estado)
- **Web Audio API** (Efectos de sonido de escáner óptico, pestillo electromecánico de solenoide, alerta de bloqueo y confirmación)

---

## 💻 Instrucciones para Ejecutar

### 1. Clonar o abrir la carpeta en la terminal:
```bash
cd "c:\Users\Hernann thomas\OneDrive\Desktop\SISTEMAS DE OBJETOS PERDIDOS"
```

### 2. Iniciar el servidor de desarrollo local:
```bash
npm run dev
```

El aplicativo estará disponible en:
```
http://localhost:5173
```

### 3. Compilar para producción:
```bash
npm run build
```
