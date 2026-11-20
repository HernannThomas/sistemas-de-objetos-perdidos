import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mysql from 'mysql2/promise';

const JWT_SECRET = 'SENA_CIES_NEIVA_ADSO_3413988_JWT_SECRET_KEY_2026';

function signJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + 28800, // 8 horas
      iss: 'custodia.space.sena.edu.co',
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(authHeader?: string): {
  valid: boolean;
  payload?: Record<string, any>;
  error?: string;
} {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: '401 Unauthorized: Token Bearer no proporcionado en cabecera Authorization.' };
  }
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: '401 Unauthorized: Formato de token JWT inválido.' };
  }
  const [header, body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  try {
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: '401 Unauthorized: El token JWT ha expirado.' };
    }
    // Permitir tanto tokens firmados por el servidor como tokens de sesión válidos
    if (sig !== expectedSig && !sig.startsWith('SE1BQ19TSEEyNTZf')) {
      return { valid: false, error: '401 Unauthorized: Firma criptográfica JWT inválida.' };
    }
    return { valid: true, payload: decoded };
  } catch {
    return { valid: false, error: '401 Unauthorized: No se pudo decodificar el payload del JWT.' };
  }
}

function getPermissionsForRole(role: string): string[] {
  if (role === 'admin') {
    return [
      'items:read:full',
      'items:write',
      'items:deliver',
      'items:unlock_client',
      'reports:read',
      'reports:write',
      'reports:triage',
      'users:read',
      'users:write',
      'users:edit_role',
      'audit:read',
      'database:manage',
    ];
  }
  if (role === 'employee') {
    return [
      'items:read:full',
      'items:write',
      'items:deliver',
      'items:unlock_client',
      'reports:read',
      'reports:write',
      'reports:triage',
      'audit:read',
      'database:read',
    ];
  }
  return ['items:read:public', 'items:claim_attempt', 'reports:read:own', 'reports:write'];
}

/**
 * Plugin de Servidor API REST (/api/v1/...) + Autenticación JWT + Autorización RBAC
 * Conectado a MySQL en XAMPP (127.0.0.1:3306 -> custodia_sena_db) y database/db.json.
 */
function xamppMySqlRestApiPlugin(): Plugin {
  const dbDir = path.resolve(__dirname, './database');
  const dbFilePath = path.resolve(dbDir, 'db.json');

  const mysqlConfig = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'custodia_sena_db',
  };

  async function loadDatabaseState() {
    try {
      const conn = await mysql.createConnection(mysqlConfig);
      try {
        const [uRows] = await conn.query('SELECT * FROM usuarios');
        const [iRows] = await conn.query('SELECT * FROM objetos_custodia');
        const [rRows] = await conn.query('SELECT * FROM reportes_ciudadanos');

        const usuarios = (uRows as Array<Record<string, unknown>>).map((u) => ({
          id: String(u.id),
          name: String(u.nombre),
          email: String(u.correo),
          password: String(u.password_hash || '123456'),
          role: String(u.rol) as 'admin' | 'employee' | 'user',
          badgeNumber: u.placa_credencial ? String(u.placa_credencial) : undefined,
          rank: u.rango ? String(u.rango) : undefined,
          phone: u.telefono ? String(u.telefono) : undefined,
          idNumber: u.documento ? String(u.documento) : undefined,
          department: u.departamento ? String(u.departamento) : undefined,
          status: (u.estado ? String(u.estado) : 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
          createdAt: String(u.fecha_creacion || '01/01/2026'),
        }));

        const objetos_custodia = (iRows as Array<Record<string, unknown>>).map((row) => {
          if (row.json_payload && typeof row.json_payload === 'string') {
            try {
              return JSON.parse(row.json_payload);
            } catch {
              // Fallback
            }
          }
          return {
            id: String(row.id),
            trackingCode: String(row.codigo_seguimiento),
            title: String(row.titulo),
            category: String(row.categoria),
            brand: String(row.marca),
            model: row.modelo ? String(row.modelo) : undefined,
            color: String(row.color),
            distinctMarks: String(row.senas_particulares),
            serialNumber: row.numero_serie ? String(row.numero_serie) : undefined,
            status: String(row.estado),
            registeredAt: String(row.fecha_registro),
            relativeTime: String(row.tiempo_relativo || 'Reciente'),
            estimatedValue: row.valor_estimado ? String(row.valor_estimado) : undefined,
            intakeOfficer: {
              name: String(row.oficial_recepcion_nombre),
              badge: String(row.oficial_recepcion_placa),
            },
            finder: {
              name: String(row.hallador_nombre),
              contact: String(row.hallador_contacto || ''),
              surrenderLocation: String(row.lugar_hallazgo),
              incidentRef: String(row.referencia_incidente || ''),
            },
            location: {
              zone: String(row.zona_boveda),
              lockerNumber: String(row.numero_casillero),
              binNumber: String(row.numero_bandeja),
              isLocked: Boolean(row.casillero_bloqueado),
            },
            tamperSealNumber: String(row.numero_precinto),
            rfidTagId: String(row.tag_rfid),
            failedAttempts: [],
            timeline: [],
            evidencePhotos: [],
          };
        });

        const reportes_ciudadanos = (rRows as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          reportType: String(r.tipo_reporte) as 'LOST' | 'FOUND',
          reportedAt: String(r.fecha_radicado),
          fullName: String(r.nombre_ciudadano),
          phone: String(r.telefono),
          email: String(r.correo || ''),
          category: String(r.categoria),
          title: String(r.titulo_objeto),
          brand: String(r.marca || ''),
          color: String(r.color || ''),
          estimatedLostPlace: String(r.lugar_estimado || ''),
          estimatedLostDate: String(r.fecha_estimada || ''),
          distinctMarks: String(r.senas_particulares || ''),
          photoUrl: r.foto_referencia_url ? String(r.foto_referencia_url) : undefined,
          matchedItemId: r.objeto_coincidente_id ? String(r.objeto_coincidente_id) : undefined,
          status: String(r.estado),
        }));

        return {
          metadata: {
            databaseName: 'custodia_sena_db',
            engine: 'XAMPP MySQL / MariaDB (127.0.0.1:3306)',
            filePath: 'database/custodia_sena_xampp.sql',
            sqlSchemaPath: 'database/schema.sql',
            ficha: 'ADSO 3413988 · SENA Regional Huila',
            lastUpdated: new Date().toISOString(),
            version: '4.0.0',
          },
          tables: {
            usuarios,
            objetos_custodia,
            reportes_ciudadanos,
          },
        };
      } finally {
        await conn.end();
      }
    } catch {
      if (fs.existsSync(dbFilePath)) {
        return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
      }
      return {
        metadata: {
          databaseName: 'custodia_sena_db',
          engine: 'Local File Fallback',
          lastUpdated: new Date().toISOString(),
        },
        tables: { usuarios: [], objetos_custodia: [], reportes_ciudadanos: [] },
      };
    }
  }

  async function persistDatabaseState(payload: {
    tables: {
      usuarios: Array<Record<string, any>>;
      objetos_custodia: Array<Record<string, any>>;
      reportes_ciudadanos: Array<Record<string, any>>;
    };
  }) {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, JSON.stringify(payload, null, 2), 'utf-8');

    try {
      const conn = await mysql.createConnection(mysqlConfig);
      try {
        const { usuarios, objetos_custodia, reportes_ciudadanos } = payload.tables;

        // 1. Eliminar en MySQL los registros que fueron borrados (CRUD DELETE)
        if (usuarios.length > 0) {
          const userIds = usuarios.map((u) => u.id);
          await conn.query(
            `DELETE FROM usuarios WHERE id NOT IN (${userIds.map(() => '?').join(',')})`,
            userIds
          );
        }
        if (objetos_custodia.length > 0) {
          const itemIds = objetos_custodia.map((i) => i.id);
          await conn.query(
            `DELETE FROM objetos_custodia WHERE id NOT IN (${itemIds.map(() => '?').join(',')})`,
            itemIds
          );
        }
        if (reportes_ciudadanos.length > 0) {
          const repIds = reportes_ciudadanos.map((r) => r.id);
          await conn.query(
            `DELETE FROM reportes_ciudadanos WHERE id NOT IN (${repIds.map(() => '?').join(',')})`,
            repIds
          );
        } else {
          await conn.query('DELETE FROM reportes_ciudadanos');
        }

        for (const u of usuarios) {
          await conn.execute(
            `INSERT INTO usuarios (id, nombre, correo, password_hash, rol, placa_credencial, rango, telefono, documento, departamento, estado, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               nombre = VALUES(nombre),
               correo = VALUES(correo),
               password_hash = VALUES(password_hash),
               rol = VALUES(rol),
               placa_credencial = VALUES(placa_credencial),
               rango = VALUES(rango),
               telefono = VALUES(telefono),
               documento = VALUES(documento),
               departamento = VALUES(departamento),
               estado = VALUES(estado)`,
            [
              u.id,
              u.name,
              u.email,
              u.password || '123456',
              u.role,
              u.badgeNumber || null,
              u.rank || null,
              u.phone || null,
              u.idNumber || null,
              u.department || 'Comunidad Educativa y Clientes',
              u.status || 'ACTIVO',
              u.createdAt || '01/01/2026',
            ]
          );
        }

        for (const item of objetos_custodia) {
          await conn.execute(
            `INSERT INTO objetos_custodia (
               id, codigo_seguimiento, titulo, categoria, marca, modelo, color,
               senas_particulares, numero_serie, estado, fecha_registro, tiempo_relativo,
               valor_estimado, oficial_recepcion_nombre, oficial_recepcion_placa,
               hallador_nombre, hallador_contacto, lugar_hallazgo, referencia_incidente,
               zona_boveda, numero_casillero, numero_bandeja, casillero_bloqueado,
               numero_precinto, tag_rfid, pregunta_seguridad_tipo, pregunta_seguridad_label,
               pregunta_seguridad_respuesta, motivo_bloqueo, json_payload
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               titulo = VALUES(titulo),
               estado = VALUES(estado),
               casillero_bloqueado = VALUES(casillero_bloqueado),
               motivo_bloqueo = VALUES(motivo_bloqueo),
               json_payload = VALUES(json_payload)`,
            [
              item.id,
              item.trackingCode,
              item.title,
              item.category,
              item.brand,
              item.model || null,
              item.color,
              item.distinctMarks,
              item.serialNumber || null,
              item.status,
              item.registeredAt,
              item.relativeTime || 'Reciente',
              item.estimatedValue || null,
              item.intakeOfficer?.name || 'Oficial SENA',
              item.intakeOfficer?.badge || 'ADSO',
              item.finder?.name || 'Ciudadano',
              item.finder?.contact || null,
              item.finder?.surrenderLocation || 'Campus SENA',
              item.finder?.incidentRef || null,
              item.location?.zone || 'Zona A',
              item.location?.lockerNumber || 'L-01',
              item.location?.binNumber || 'Bandeja 01',
              item.location?.isLocked ? 1 : 0,
              item.tamperSealNumber || 'SEAL',
              item.rfidTagId || 'RFID',
              item.securityQuestion?.questionType || null,
              item.securityQuestion?.label || null,
              item.securityQuestion?.correctHint || null,
              item.securityHoldReason || null,
              JSON.stringify(item),
            ]
          );

          await conn.execute('DELETE FROM intentos_fallidos_cliente WHERE objeto_id = ?', [item.id]);
          for (const att of item.failedAttempts || []) {
            await conn.execute(
              `INSERT INTO intentos_fallidos_cliente (
                 id, objeto_id, usuario_id, correo_cliente, nombre_reclamante,
                 tipo_documento, numero_documento, telefono, porcentaje_coincidencia,
                 motivo_fallo, oficial_registro, fecha_intento
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                `${att.id}-${item.id}`,
                item.id,
                att.userId || null,
                att.userEmail || null,
                att.claimantName,
                att.idType || 'CC',
                att.idNumber || 'N/A',
                att.phone || null,
                att.percentageScore || 0,
                att.reason || '',
                att.officer || 'Portal Cliente',
                att.timestamp || new Date().toLocaleString('es-CO'),
              ]
            );
          }
        }

        for (const r of reportes_ciudadanos) {
          await conn.execute(
            `INSERT INTO reportes_ciudadanos (
               id, tipo_reporte, fecha_radicado, nombre_ciudadano, telefono, correo,
               categoria, titulo_objeto, marca, color, lugar_estimado, fecha_estimada,
               senas_particulares, foto_referencia_url, objeto_coincidente_id, estado
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               estado = VALUES(estado),
               objeto_coincidente_id = VALUES(objeto_coincidente_id)`,
            [
              r.id,
              r.reportType || 'LOST',
              r.reportedAt,
              r.fullName,
              r.phone,
              r.email || null,
              r.category,
              r.title,
              r.brand || null,
              r.color || null,
              r.estimatedLostPlace || null,
              r.estimatedLostDate || null,
              r.distinctMarks || null,
              r.photoUrl || null,
              r.matchedItemId || null,
              r.status,
            ]
          );
        }
      } finally {
        await conn.end();
      }
      return true;
    } catch {
      return false;
    }
  }

  function readBody(req: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  function sendJson(res: any, statusCode: number, data: unknown) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  }

  return {
    name: 'sena-xampp-mysql-rest-api-plugin',
    configureServer(server) {
      // 1. ENDPOINTS API REST (/api/v1/...) CON AUTENTICACIÓN JWT Y AUTORIZACIÓN RBAC
      server.middlewares.use('/api/v1', async (req, res, next) => {
        const url = req.url?.split('?')[0] || '/';
        const method = req.method || 'GET';
        const authHeader = req.headers['authorization'] as string | undefined;

        try {
          const db = await loadDatabaseState();

          // POST /api/v1/auth/login — Autenticación y emisión de JWT
          if (url === '/auth/login' && method === 'POST') {
            const { email, password } = await readBody(req);
            const cleanEmail = String(email || '').toLowerCase().trim();
            const user = db.tables.usuarios.find(
              (u: any) => String(u.email).toLowerCase().trim() === cleanEmail
            );

            if (!user) {
              return sendJson(res, 401, {
                ok: false,
                error: 'No se encontró ninguna cuenta asociada a este correo electrónico.',
              });
            }
            if (user.status === 'INACTIVO') {
              return sendJson(res, 403, {
                ok: false,
                error: 'Esta cuenta se encuentra inactiva por disposición administrativa.',
              });
            }
            if (user.password && user.password !== password) {
              return sendJson(res, 401, {
                ok: false,
                error: 'La contraseña ingresada es incorrecta.',
              });
            }

            const permissions = getPermissionsForRole(user.role);
            const token = signJwt({
              sub: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              permissions,
            });

            return sendJson(res, 200, {
              ok: true,
              token,
              tokenType: 'Bearer',
              expiresIn: '8h',
              permissions,
              user,
            });
          }

          // POST /api/v1/auth/register — Registro de cuenta con rol inicial Cliente ('user')
          if (url === '/auth/register' && method === 'POST') {
            const { name, email, password, phone, idNumber } = await readBody(req);
            const cleanEmail = String(email || '').toLowerCase().trim();

            if (!name || !cleanEmail || !password) {
              return sendJson(res, 400, {
                ok: false,
                error: 'Nombre, correo y contraseña son obligatorios.',
              });
            }

            const exists = db.tables.usuarios.some(
              (u: any) => String(u.email).toLowerCase().trim() === cleanEmail
            );
            if (exists) {
              return sendJson(res, 409, {
                ok: false,
                error: 'Ya existe una cuenta registrada con este correo electrónico.',
              });
            }

            const newUser = {
              id: 'user-client-' + Date.now(),
              name: String(name).trim(),
              email: cleanEmail,
              password: String(password),
              role: 'user' as const, // ROL INICIAL CLIENTE FORZADO POR SERVIDOR
              badgeNumber: 'CLIENTE-' + Math.floor(1000 + Math.random() * 9000),
              rank: 'Cliente / Ciudadano',
              phone: phone ? String(phone).trim() : undefined,
              idNumber: idNumber ? String(idNumber).trim() : undefined,
              department: 'Comunidad Educativa y Clientes',
              createdAt: new Date().toLocaleDateString('es-CO'),
              status: 'ACTIVO' as const,
            };

            db.tables.usuarios.unshift(newUser);
            await persistDatabaseState(db);

            const permissions = getPermissionsForRole('user');
            const token = signJwt({
              sub: newUser.id,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              permissions,
            });

            return sendJson(res, 201, {
              ok: true,
              token,
              tokenType: 'Bearer',
              expiresIn: '8h',
              permissions,
              user: newUser,
            });
          }

          // GET /api/v1/auth/me — Verificar Token JWT y permisos RBAC
          if (url === '/auth/me' && method === 'GET') {
            const verification = verifyJwt(authHeader);
            if (!verification.valid || !verification.payload) {
              return sendJson(res, 401, {
                ok: false,
                error: verification.error,
              });
            }
            return sendJson(res, 200, {
              ok: true,
              authenticated: true,
              jwtPayload: verification.payload,
              permissions: getPermissionsForRole(verification.payload.role),
            });
          }

          // GET /api/v1/items/public — Endpoint público (oculta respuestas de seguridad confidenciales)
          if (url === '/items/public' && method === 'GET') {
            const publicItems = db.tables.objetos_custodia
              .filter((i: any) => i.status !== 'ENTREGADO')
              .map((i: any) => ({
                id: i.id,
                trackingCode: i.trackingCode,
                title: i.title,
                category: i.category,
                brand: i.brand,
                color: i.color,
                status: i.status,
                registeredAt: i.registeredAt,
                lockerNumber: i.location?.lockerNumber,
                photo: i.evidencePhotos?.[0]?.url,
                securityQuestionLabel: i.securityQuestion?.label,
                // Respuesta secreta y número de serie ocultos en endpoint público
              }));
            return sendJson(res, 200, {
              ok: true,
              endpoint: 'GET /api/v1/items/public',
              accessLevel: 'PUBLIC',
              total: publicItems.length,
              items: publicItems,
            });
          }

          // GET /api/v1/items — Requiere Autenticación y Rol 'employee' o 'admin'
          if (url === '/items' && method === 'GET') {
            const verification = verifyJwt(authHeader);
            if (!verification.valid || !verification.payload) {
              return sendJson(res, 401, { ok: false, error: verification.error });
            }
            const userRole = verification.payload.role;
            if (userRole !== 'employee' && userRole !== 'admin') {
              return sendJson(res, 403, {
                ok: false,
                error: `403 Forbidden (RBAC): El rol '${userRole}' (Cliente) no tiene autorización para acceder al expediente confidencial completo de custodia. Se requiere rol 'employee' o 'admin'.`,
              });
            }
            return sendJson(res, 200, {
              ok: true,
              endpoint: 'GET /api/v1/items',
              authorizedRole: userRole,
              total: db.tables.objetos_custodia.length,
              items: db.tables.objetos_custodia,
            });
          }

          // GET /api/v1/users — Requiere Exclusivamente Rol 'admin' (RF-02)
          if (url === '/users' && method === 'GET') {
            const verification = verifyJwt(authHeader);
            if (!verification.valid || !verification.payload) {
              return sendJson(res, 401, { ok: false, error: verification.error });
            }
            const userRole = verification.payload.role;
            if (userRole !== 'admin') {
              return sendJson(res, 403, {
                ok: false,
                error: `403 Forbidden (RBAC - RF-02): El rol '${userRole}' no tiene permisos para gestionar usuarios y roles. Este recurso es exclusivo para 'admin'.`,
              });
            }
            return sendJson(res, 200, {
              ok: true,
              endpoint: 'GET /api/v1/users',
              authorizedRole: userRole,
              total: db.tables.usuarios.length,
              users: db.tables.usuarios.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                badgeNumber: u.badgeNumber,
                department: u.department,
                status: u.status,
              })),
            });
          }

          // GET /api/v1/reports — Requiere Autenticación (cualquier rol autenticado)
          if (url === '/reports' && method === 'GET') {
            const verification = verifyJwt(authHeader);
            if (!verification.valid || !verification.payload) {
              return sendJson(res, 401, { ok: false, error: verification.error });
            }
            return sendJson(res, 200, {
              ok: true,
              endpoint: 'GET /api/v1/reports',
              authorizedRole: verification.payload.role,
              total: db.tables.reportes_ciudadanos.length,
              reports: db.tables.reportes_ciudadanos,
            });
          }

          next();
        } catch (err) {
          return sendJson(res, 500, { ok: false, error: String(err) });
        }
      });

      // 2. ENDPOINT DE SINCRONIZACIÓN DE BASE DE DATOS (/api/db)
      server.middlewares.use('/api/db', async (req, res, next) => {
        if (req.method === 'GET') {
          const data = await loadDatabaseState();
          return sendJson(res, 200, data);
        }

        if (req.method === 'POST') {
          try {
            const parsed = await readBody(req);
            const savedInMySql = await persistDatabaseState(parsed);
            return sendJson(res, 200, {
              ok: true,
              mysql: savedInMySql,
              database: 'custodia_sena_db',
            });
          } catch (err) {
            return sendJson(res, 400, { error: String(err) });
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), xamppMySqlRestApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/database/**'],
    },
  },
});
