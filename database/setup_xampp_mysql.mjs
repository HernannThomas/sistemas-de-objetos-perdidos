import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbJsonPath = path.join(__dirname, 'db.json');

const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
const { usuarios, objetos_custodia, reportes_ciudadanos } = dbData.tables;

function esc(val) {
  if (val === undefined || val === null) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return String(val);
  return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\r?\n/g, '\\n') + "'";
}

// 1. Generar el archivo SQL completo para XAMPP / phpMyAdmin (database/custodia_sena_xampp.sql)
let sql = `-- =============================================================================
-- BASE DE DATOS MYSQL PARA XAMPP / PHPMYADMIN
-- Proyecto: Custodia.Space · Sistema de Objetos Perdidos SENA CIES Neiva
-- Ficha ADSO: 3413988
-- Servidor: 127.0.0.1:3306 (XAMPP MySQL / MariaDB)
-- Base de Datos: custodia_sena_db
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS \`custodia_sena_db\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE \`custodia_sena_db\`;

-- 1. TABLA: usuarios
DROP TABLE IF EXISTS \`usuarios\`;
CREATE TABLE \`usuarios\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`nombre\` VARCHAR(150) NOT NULL,
  \`correo\` VARCHAR(150) NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL DEFAULT '123456',
  \`rol\` ENUM('admin', 'employee', 'user') NOT NULL DEFAULT 'user',
  \`placa_credencial\` VARCHAR(60) DEFAULT NULL,
  \`rango\` VARCHAR(100) DEFAULT NULL,
  \`telefono\` VARCHAR(40) DEFAULT NULL,
  \`documento\` VARCHAR(40) DEFAULT NULL,
  \`departamento\` VARCHAR(150) DEFAULT 'Comunidad Educativa y Clientes',
  \`estado\` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  \`fecha_creacion\` VARCHAR(30) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_usuarios_correo\` (\`correo\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA: objetos_custodia
DROP TABLE IF EXISTS \`objetos_custodia\`;
CREATE TABLE \`objetos_custodia\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`codigo_seguimiento\` VARCHAR(64) NOT NULL,
  \`titulo\` VARCHAR(200) NOT NULL,
  \`categoria\` VARCHAR(40) NOT NULL,
  \`marca\` VARCHAR(100) NOT NULL,
  \`modelo\` VARCHAR(120) DEFAULT NULL,
  \`color\` VARCHAR(80) NOT NULL,
  \`senas_particulares\` TEXT NOT NULL,
  \`numero_serie\` VARCHAR(100) DEFAULT NULL,
  \`estado\` ENUM('EN_CUSTODIA', 'ENTREGADO', 'ADVERTENCIA', 'BLOQUEADO_POR_SEGURIDAD') NOT NULL DEFAULT 'EN_CUSTODIA',
  \`fecha_registro\` VARCHAR(40) NOT NULL,
  \`tiempo_relativo\` VARCHAR(50) DEFAULT 'Reciente',
  \`valor_estimado\` VARCHAR(60) DEFAULT NULL,
  \`oficial_recepcion_nombre\` VARCHAR(150) NOT NULL,
  \`oficial_recepcion_placa\` VARCHAR(50) NOT NULL,
  \`hallador_nombre\` VARCHAR(150) NOT NULL,
  \`hallador_contacto\` VARCHAR(60) DEFAULT NULL,
  \`lugar_hallazgo\` VARCHAR(200) NOT NULL,
  \`referencia_incidente\` VARCHAR(50) DEFAULT NULL,
  \`zona_boveda\` VARCHAR(100) NOT NULL,
  \`numero_casillero\` VARCHAR(20) NOT NULL,
  \`numero_bandeja\` VARCHAR(50) NOT NULL,
  \`casillero_bloqueado\` TINYINT(1) DEFAULT 1,
  \`numero_precinto\` VARCHAR(50) NOT NULL,
  \`tag_rfid\` VARCHAR(50) NOT NULL,
  \`pregunta_seguridad_tipo\` VARCHAR(40) DEFAULT NULL,
  \`pregunta_seguridad_label\` TEXT DEFAULT NULL,
  \`pregunta_seguridad_respuesta\` TEXT DEFAULT NULL,
  \`motivo_bloqueo\` TEXT DEFAULT NULL,
  \`json_payload\` LONGTEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_codigo_seguimiento\` (\`codigo_seguimiento\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA: fotografias_evidencia
DROP TABLE IF EXISTS \`fotografias_evidencia\`;
CREATE TABLE \`fotografias_evidencia\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`objeto_id\` VARCHAR(64) NOT NULL,
  \`url\` TEXT NOT NULL,
  \`descripcion\` VARCHAR(255) DEFAULT NULL,
  \`fecha_captura\` VARCHAR(40) NOT NULL,
  \`peso_kb\` INT DEFAULT 280,
  PRIMARY KEY (\`id\`),
  KEY \`idx_foto_objeto\` (\`objeto_id\`),
  CONSTRAINT \`fk_foto_objeto\` FOREIGN KEY (\`objeto_id\`) REFERENCES \`objetos_custodia\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA: intentos_fallidos_cliente
DROP TABLE IF EXISTS \`intentos_fallidos_cliente\`;
CREATE TABLE \`intentos_fallidos_cliente\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`objeto_id\` VARCHAR(64) NOT NULL,
  \`usuario_id\` VARCHAR(64) DEFAULT NULL,
  \`correo_cliente\` VARCHAR(150) DEFAULT NULL,
  \`nombre_reclamante\` VARCHAR(150) NOT NULL,
  \`tipo_documento\` VARCHAR(20) NOT NULL,
  \`numero_documento\` VARCHAR(50) NOT NULL,
  \`telefono\` VARCHAR(40) DEFAULT NULL,
  \`porcentaje_coincidencia\` INT NOT NULL,
  \`motivo_fallo\` TEXT NOT NULL,
  \`oficial_registro\` VARCHAR(150) NOT NULL,
  \`fecha_intento\` VARCHAR(40) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_intento_objeto\` (\`objeto_id\`),
  CONSTRAINT \`fk_intento_objeto\` FOREIGN KEY (\`objeto_id\`) REFERENCES \`objetos_custodia\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA: reportes_ciudadanos
DROP TABLE IF EXISTS \`reportes_ciudadanos\`;
CREATE TABLE \`reportes_ciudadanos\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tipo_reporte\` ENUM('LOST', 'FOUND') NOT NULL DEFAULT 'LOST',
  \`fecha_radicado\` VARCHAR(40) NOT NULL,
  \`nombre_ciudadano\` VARCHAR(150) NOT NULL,
  \`telefono\` VARCHAR(40) NOT NULL,
  \`correo\` VARCHAR(150) DEFAULT NULL,
  \`categoria\` VARCHAR(40) NOT NULL,
  \`titulo_objeto\` VARCHAR(200) NOT NULL,
  \`marca\` VARCHAR(100) DEFAULT NULL,
  \`color\` VARCHAR(80) DEFAULT NULL,
  \`lugar_estimado\` VARCHAR(200) DEFAULT NULL,
  \`fecha_estimada\` VARCHAR(40) DEFAULT NULL,
  \`senas_particulares\` TEXT DEFAULT NULL,
  \`foto_referencia_url\` LONGTEXT DEFAULT NULL,
  \`objeto_coincidente_id\` VARCHAR(64) DEFAULT NULL,
  \`estado\` VARCHAR(40) NOT NULL DEFAULT 'PENDIENTE_REVISION',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA: bitacora_auditoria
DROP TABLE IF EXISTS \`bitacora_auditoria\`;
CREATE TABLE \`bitacora_auditoria\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`objeto_id\` VARCHAR(64) NOT NULL,
  \`titulo_evento\` VARCHAR(200) NOT NULL,
  \`fecha_hora\` VARCHAR(40) NOT NULL,
  \`oficial_nombre\` VARCHAR(150) NOT NULL,
  \`oficial_placa\` VARCHAR(50) NOT NULL,
  \`estado_evento\` VARCHAR(30) NOT NULL,
  \`notas\` TEXT NOT NULL,
  \`hash_sha256\` VARCHAR(128) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_bitacora_objeto\` (\`objeto_id\`),
  CONSTRAINT \`fk_bitacora_objeto\` FOREIGN KEY (\`objeto_id\`) REFERENCES \`objetos_custodia\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INSERCIÓN DE DATOS: USUARIOS
-- =============================================================================
`;

for (const u of usuarios) {
  sql += `INSERT INTO \`usuarios\` (\`id\`, \`nombre\`, \`correo\`, \`password_hash\`, \`rol\`, \`placa_credencial\`, \`rango\`, \`telefono\`, \`documento\`, \`departamento\`, \`estado\`, \`fecha_creacion\`) VALUES (${esc(u.id)}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.password || '123456')}, ${esc(u.role)}, ${esc(u.badgeNumber)}, ${esc(u.rank)}, ${esc(u.phone)}, ${esc(u.idNumber)}, ${esc(u.department)}, ${esc(u.status || 'ACTIVO')}, ${esc(u.createdAt || '01/01/2026')});\n`;
}

sql += `\n-- =============================================================================\n-- INSERCIÓN DE DATOS: OBJETOS EN CUSTODIA (35 OBJETOS), FOTOS, INTENTOS Y BITÁCORA\n-- =============================================================================\n`;

for (const item of objetos_custodia) {
  sql += `INSERT INTO \`objetos_custodia\` (\`id\`, \`codigo_seguimiento\`, \`titulo\`, \`categoria\`, \`marca\`, \`modelo\`, \`color\`, \`senas_particulares\`, \`numero_serie\`, \`estado\`, \`fecha_registro\`, \`tiempo_relativo\`, \`valor_estimado\`, \`oficial_recepcion_nombre\`, \`oficial_recepcion_placa\`, \`hallador_nombre\`, \`hallador_contacto\`, \`lugar_hallazgo\`, \`referencia_incidente\`, \`zona_boveda\`, \`numero_casillero\`, \`numero_bandeja\`, \`casillero_bloqueado\`, \`numero_precinto\`, \`tag_rfid\`, \`pregunta_seguridad_tipo\`, \`pregunta_seguridad_label\`, \`pregunta_seguridad_respuesta\`, \`motivo_bloqueo\`, \`json_payload\`) VALUES (${esc(item.id)}, ${esc(item.trackingCode)}, ${esc(item.title)}, ${esc(item.category)}, ${esc(item.brand)}, ${esc(item.model)}, ${esc(item.color)}, ${esc(item.distinctMarks)}, ${esc(item.serialNumber)}, ${esc(item.status)}, ${esc(item.registeredAt)}, ${esc(item.relativeTime)}, ${esc(item.estimatedValue)}, ${esc(item.intakeOfficer?.name || 'Oficial SENA')}, ${esc(item.intakeOfficer?.badge || 'ADSO')}, ${esc(item.finder?.name || 'Ciudadano')}, ${esc(item.finder?.contact)}, ${esc(item.finder?.surrenderLocation || 'Campus SENA')}, ${esc(item.finder?.incidentRef)}, ${esc(item.location?.zone || 'Zona A')}, ${esc(item.location?.lockerNumber || 'L-01')}, ${esc(item.location?.binNumber || 'Bandeja 1')}, ${esc(Boolean(item.location?.isLocked))}, ${esc(item.tamperSealNumber)}, ${esc(item.rfidTagId)}, ${esc(item.securityQuestion?.questionType)}, ${esc(item.securityQuestion?.label)}, ${esc(item.securityQuestion?.correctHint)}, ${esc(item.securityHoldReason)}, ${esc(JSON.stringify(item))});\n`;

  for (const photo of item.evidencePhotos || []) {
    sql += `INSERT INTO \`fotografias_evidencia\` (\`id\`, \`objeto_id\`, \`url\`, \`descripcion\`, \`fecha_captura\`, \`peso_kb\`) VALUES (${esc(photo.id + '-' + item.id)}, ${esc(item.id)}, ${esc(photo.url)}, ${esc(photo.caption)}, ${esc(photo.timestamp)}, ${esc(photo.sizeKb || 280)});\n`;
  }

  for (const att of item.failedAttempts || []) {
    sql += `INSERT INTO \`intentos_fallidos_cliente\` (\`id\`, \`objeto_id\`, \`usuario_id\`, \`correo_cliente\`, \`nombre_reclamante\`, \`tipo_documento\`, \`numero_documento\`, \`telefono\`, \`porcentaje_coincidencia\`, \`motivo_fallo\`, \`oficial_registro\`, \`fecha_intento\`) VALUES (${esc(att.id + '-' + item.id)}, ${esc(item.id)}, ${esc(att.userId)}, ${esc(att.userEmail)}, ${esc(att.claimantName)}, ${esc(att.idType)}, ${esc(att.idNumber)}, ${esc(att.phone)}, ${esc(att.percentageScore)}, ${esc(att.reason)}, ${esc(att.officer)}, ${esc(att.timestamp)});\n`;
  }

  for (const step of item.timeline || []) {
    sql += `INSERT INTO \`bitacora_auditoria\` (\`id\`, \`objeto_id\`, \`titulo_evento\`, \`fecha_hora\`, \`oficial_nombre\`, \`oficial_placa\`, \`estado_evento\`, \`notas\`, \`hash_sha256\`) VALUES (${esc(step.id + '-' + item.id)}, ${esc(item.id)}, ${esc(step.title)}, ${esc(step.timestamp)}, ${esc(step.officer)}, ${esc(step.officerBadge)}, ${esc(step.status)}, ${esc(step.notes)}, ${esc(step.hash)});\n`;
  }
}

sql += `\n-- =============================================================================\n-- INSERCIÓN DE DATOS: REPORTES CIUDADANOS\n-- =============================================================================\n`;

for (const r of reportes_ciudadanos) {
  sql += `INSERT INTO \`reportes_ciudadanos\` (\`id\`, \`tipo_reporte\`, \`fecha_radicado\`, \`nombre_ciudadano\`, \`telefono\`, \`correo\`, \`categoria\`, \`titulo_objeto\`, \`marca\`, \`color\`, \`lugar_estimado\`, \`fecha_estimada\`, \`senas_particulares\`, \`foto_referencia_url\`, \`objeto_coincidente_id\`, \`estado\`) VALUES (${esc(r.id)}, ${esc(r.reportType)}, ${esc(r.reportedAt)}, ${esc(r.fullName)}, ${esc(r.phone)}, ${esc(r.email)}, ${esc(r.category)}, ${esc(r.title)}, ${esc(r.brand)}, ${esc(r.color)}, ${esc(r.estimatedLostPlace)}, ${esc(r.estimatedLostDate)}, ${esc(r.distinctMarks)}, ${esc(r.photoUrl)}, ${esc(r.matchedItemId)}, ${esc(r.status)});\n`;
}

sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

const sqlOutPath = path.join(__dirname, 'custodia_sena_xampp.sql');
fs.writeFileSync(sqlOutPath, sql, 'utf-8');
console.log('Archivo SQL generado en: database/custodia_sena_xampp.sql');

// 2. Conectar a MySQL de XAMPP (localhost:3306, usuario: root, sin clave) e inyectar toda la base de datos
async function provisionXamppMySQL() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    multipleStatements: true,
  });

  await conn.query(sql);
  const [rows] = await conn.query('SELECT COUNT(*) AS totalObjetos FROM custodia_sena_db.objetos_custodia');
  const [uRows] = await conn.query('SELECT COUNT(*) AS totalUsuarios FROM custodia_sena_db.usuarios');
  console.log(`XAMPP MySQL Provisionado con éxito -> Base de Datos: custodia_sena_db (${rows[0].totalObjetos} objetos, ${uRows[0].totalUsuarios} usuarios en MySQL).`);
  await conn.end();
}

provisionXamppMySQL().catch((err) => {
  console.error('Aviso al conectar a MySQL:', err.message);
  process.exit(1);
});
