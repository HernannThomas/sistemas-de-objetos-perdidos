-- =============================================================================
-- SISTEMA DE GESTIÓN Y CUSTODIA DE OBJETOS PERDIDOS (CUSTODIA.SPACE · SENA)
-- SENA Regional Huila · CIES Neiva · ADSO Ficha: 3413988
-- Motor Compatible: PostgreSQL / MySQL / SQLite
-- =============================================================================

-- 1. TABLA DE USUARIOS Y ROLES (RBAC - RF-01 / RF-02)
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(64) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'employee', 'user')),
    placa_credencial VARCHAR(50),
    rango VARCHAR(100),
    telefono VARCHAR(40),
    documento VARCHAR(40),
    departamento VARCHAR(150) DEFAULT 'Comunidad Educativa y Clientes',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_creacion VARCHAR(30) NOT NULL
);

-- 2. TABLA DE OBJETOS EN CUSTODIA FÍSICA (RF-03 / RF-04 / RF-05)
CREATE TABLE IF NOT EXISTS objetos_custodia (
    id VARCHAR(64) PRIMARY KEY,
    codigo_seguimiento VARCHAR(64) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    categoria VARCHAR(40) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(120),
    color VARCHAR(80) NOT NULL,
    senas_particulares TEXT NOT NULL,
    numero_serie VARCHAR(100),
    estado VARCHAR(40) NOT NULL DEFAULT 'EN_CUSTODIA' CHECK (estado IN ('EN_CUSTODIA', 'ENTREGADO', 'ADVERTENCIA', 'BLOQUEADO_POR_SEGURIDAD')),
    fecha_registro VARCHAR(40) NOT NULL,
    valor_estimado VARCHAR(60),
    oficial_recepcion_nombre VARCHAR(150) NOT NULL,
    oficial_recepcion_placa VARCHAR(50) NOT NULL,
    hallador_nombre VARCHAR(150) NOT NULL,
    hallador_contacto VARCHAR(60),
    lugar_hallazgo VARCHAR(200) NOT NULL,
    referencia_incidente VARCHAR(50),
    zona_boveda VARCHAR(100) NOT NULL,
    numero_casillero VARCHAR(20) NOT NULL,
    numero_bandeja VARCHAR(50) NOT NULL,
    casillero_bloqueado BOOLEAN DEFAULT TRUE,
    numero_precinto VARCHAR(50) NOT NULL,
    tag_rfid VARCHAR(50) NOT NULL,
    pregunta_seguridad_tipo VARCHAR(40),
    pregunta_seguridad_label TEXT,
    pregunta_seguridad_respuesta TEXT,
    motivo_bloqueo TEXT
);

-- 3. TABLA DE FOTOGRAFÍAS DE EVIDENCIA (RF-04 <= 500 KB)
CREATE TABLE IF NOT EXISTS fotografias_evidencia (
    id VARCHAR(64) PRIMARY KEY,
    objeto_id VARCHAR(64) NOT NULL,
    url TEXT NOT NULL,
    descripcion VARCHAR(255),
    fecha_captura VARCHAR(40) NOT NULL,
    peso_kb INTEGER DEFAULT 280,
    FOREIGN KEY (objeto_id) REFERENCES objetos_custodia(id) ON DELETE CASCADE
);

-- 4. TABLA DE INTENTOS FALLIDOS POR CLIENTE INDIVIDUAL (RF-10 / RF-11)
-- El bloqueo al 4to intento aplica únicamente al usuario_id / correo_cliente que falló
CREATE TABLE IF NOT EXISTS intentos_fallidos_cliente (
    id VARCHAR(64) PRIMARY KEY,
    objeto_id VARCHAR(64) NOT NULL,
    usuario_id VARCHAR(64),
    correo_cliente VARCHAR(150),
    nombre_reclamante VARCHAR(150) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    telefono VARCHAR(40),
    porcentaje_coincidencia INTEGER NOT NULL,
    motivo_fallo TEXT NOT NULL,
    oficial_registro VARCHAR(150) NOT NULL,
    fecha_intento VARCHAR(40) NOT NULL,
    FOREIGN KEY (objeto_id) REFERENCES objetos_custodia(id) ON DELETE CASCADE
);

-- 5. TABLA DE ACTAS DE ENTREGA Y FIRMA DIGITAL (RF-12 / RF-13)
CREATE TABLE IF NOT EXISTS actas_entrega (
    id SERIAL PRIMARY KEY,
    objeto_id VARCHAR(64) NOT NULL UNIQUE,
    nombre_reclamante VARCHAR(150) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    correo VARCHAR(150),
    firma_digital_base64 TEXT,
    fecha_verificacion VARCHAR(40) NOT NULL,
    oficial_verificador VARCHAR(150) NOT NULL,
    placa_oficial VARCHAR(50) NOT NULL,
    porcentaje_coincidencia INTEGER NOT NULL,
    hash_certificado_sha256 VARCHAR(128) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (objeto_id) REFERENCES objetos_custodia(id) ON DELETE CASCADE
);

-- 6. TABLA DE REPORTES CIUDADANOS DE PÉRDIDA Y HALLAZGO
CREATE TABLE IF NOT EXISTS reportes_ciudadanos (
    id VARCHAR(64) PRIMARY KEY,
    tipo_reporte VARCHAR(15) NOT NULL CHECK (tipo_reporte IN ('LOST', 'FOUND')),
    fecha_radicado VARCHAR(40) NOT NULL,
    nombre_ciudadano VARCHAR(150) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    correo VARCHAR(150),
    categoria VARCHAR(40) NOT NULL,
    titulo_objeto VARCHAR(200) NOT NULL,
    marca VARCHAR(100),
    color VARCHAR(80),
    lugar_estimado VARCHAR(200),
    fecha_estimada VARCHAR(40),
    senas_particulares TEXT,
    foto_referencia_url TEXT,
    objeto_coincidente_id VARCHAR(64),
    estado VARCHAR(40) NOT NULL DEFAULT 'PENDIENTE_REVISION'
);

-- 7. TABLA DE BITÁCORA INMUTABLE DE AUDITORÍA SHA-256 (RF-14)
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id VARCHAR(64) PRIMARY KEY,
    objeto_id VARCHAR(64) NOT NULL,
    titulo_evento VARCHAR(200) NOT NULL,
    fecha_hora VARCHAR(40) NOT NULL,
    oficial_nombre VARCHAR(150) NOT NULL,
    oficial_placa VARCHAR(50) NOT NULL,
    estado_evento VARCHAR(30) NOT NULL,
    notas TEXT NOT NULL,
    hash_sha256 VARCHAR(128),
    FOREIGN KEY (objeto_id) REFERENCES objetos_custodia(id) ON DELETE CASCADE
);

-- =============================================================================
-- DATOS SEMILLA INICIALES (USUARIOS POR DEFECTO)
-- =============================================================================
INSERT INTO usuarios (id, nombre, correo, password_hash, rol, placa_credencial, rango, telefono, departamento, estado, fecha_creacion)
VALUES
('user-admin-1', 'Cap. Hernann Manchola B.', 'admin.custodia@sena.edu.co', 'admin123', 'admin', 'ADSO-ADMIN-01', 'Administrador General de Custodia', '+57 310 123 4567', 'Mando Central y Asuntos Jurídicos · SENA Huila', 'ACTIVO', '01/01/2026'),
('user-employee-1', 'Ofc. Javier Pinto Mora', 'javier.pinto@sena.edu.co', 'sena123', 'employee', 'ADSO-REC-3413988', 'Oficial de Recepción y Triaje', '+57 315 987 6543', 'Centro de Recepción y Control · Bloque A', 'ACTIVO', '15/01/2026'),
('user-client-1', 'Carlos Andrés Medina', 'carlos.medina@misena.edu.co', 'cliente123', 'user', 'CLIENTE-SENA-01', 'Cliente / Aprendiz SENA', '+57 320 555 1234', 'Comunidad Educativa y Clientes', 'ACTIVO', '10/02/2026');
