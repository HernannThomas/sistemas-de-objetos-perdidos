import React, { useState } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  FileCode,
  Table,
  HardDrive,
  ShieldCheck,
  KeyRound,
  Send,
} from 'lucide-react';
import { CustodyItem, SessionUser, CitizenLostReport } from '../types/custody';
import {
  getStoredJwtToken,
  decodeJwtPayload,
  apiRequest,
  getRolePermissions,
} from '../services/apiClient';

interface DatabaseManagerViewProps {
  users: SessionUser[];
  items: CustodyItem[];
  reports: CitizenLostReport[];
  currentUser?: SessionUser;
  isConnectedToFile: boolean;
  lastSyncedAt: string;
  onForceSync: () => void;
  onResetDatabase: () => void;
  onDeleteItem?: (itemId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onDeleteReport?: (reportId: string) => void;
  onOpenCreateItem?: () => void;
}

export const DatabaseManagerView: React.FC<DatabaseManagerViewProps> = ({
  users,
  items,
  reports,
  currentUser,
  isConnectedToFile,
  lastSyncedAt,
  onForceSync,
  onResetDatabase,
  onDeleteItem,
  onDeleteUser,
  onDeleteReport,
  onOpenCreateItem,
}) => {
  const [selectedTable, setSelectedTable] = useState<
    | 'rest_api'
    | 'objetos_custodia'
    | 'usuarios'
    | 'reportes_ciudadanos'
    | 'intentos_fallidos'
    | 'sql_schema'
  >('rest_api');

  const [apiTestResult, setApiTestResult] = useState<{
    endpoint: string;
    method: string;
    status: number;
    response: unknown;
  } | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const jwtToken = getStoredJwtToken();
  const decodedJwt = decodeJwtPayload(jwtToken);
  const activePermissions = currentUser
    ? getRolePermissions(currentUser.role)
    : decodedJwt?.permissions || [];

  const handleTestEndpoint = async (method: string, endpoint: string) => {
    setIsTestingApi(true);
    try {
      const res = await apiRequest(endpoint, { method });
      setApiTestResult({
        endpoint,
        method,
        status: res.status,
        response: res.data,
      });
    } catch (err) {
      setApiTestResult({
        endpoint,
        method,
        status: 500,
        response: { error: String(err) },
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const allFailedAttempts = items.flatMap((item) =>
    (item.failedAttempts || []).map((att) => ({
      ...att,
      itemCode: item.trackingCode,
      itemTitle: item.title,
    }))
  );

  const handleDownloadJsonDb = () => {
    const payload = {
      metadata: {
        databaseName: 'custodia_sena_db',
        filePath: 'database/db.json',
        sqlSchemaPath: 'database/schema.sql',
        exportedAt: new Date().toISOString(),
      },
      tables: {
        usuarios: users,
        objetos_custodia: items,
        reportes_ciudadanos: reports,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Motor de Base de Datos */}
      <div className="rounded-[2px] bg-white p-6 border border-[#ebebeb] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5]">
              XAMPP MYSQL / MARIADB · 127.0.0.1:3306 · SENA ADSO 3413988
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]">
              <CheckCircle2 className="h-3 w-3" />
              {isConnectedToFile
                ? 'MYSQL XAMPP ACTIVO (custodia_sena_db)'
                : 'RESPALDO LOCAL ACTIVO'}
            </span>
          </div>
          <h2 className="text-[28px] font-medium text-black leading-[1.13] tracking-[-0.836px]">
            Base de Datos MySQL en XAMPP (`custodia_sena_db`)
          </h2>
          <p className="text-[13px] text-[#b5b5b5] mt-1">
            Conectado directamente al motor MySQL de XAMPP (<code className="text-black font-mono">127.0.0.1:3306</code> · usuario <code className="text-black font-mono">root</code> · base de datos <code className="text-black font-mono">custodia_sena_db</code>) y sincronizado con <code className="text-black font-mono">database/custodia_sena_xampp.sql</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onForceSync}
            className="flex items-center gap-1.5 rounded-full border border-[#ebebeb] hover:border-black bg-white px-4 py-2 text-[13px] font-normal text-black transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sincronizar Ahora</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJsonDb}
            className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar db.json</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  '¿Deseas restaurar la base de datos a sus 35 objetos y cuentas originales?'
                )
              ) {
                onResetDatabase();
              }
            }}
            className="rounded-full border border-[#ebebeb] hover:border-black bg-[#f7f7f7] px-4 py-2 text-[13px] font-normal text-black transition cursor-pointer"
          >
            Restaurar Semilla
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas de Tablas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#ebebeb] border border-[#ebebeb]">
        <div className="bg-white p-5">
          <div className="flex items-center justify-between text-[#b5b5b5] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              TABLA: OBJETOS_CUSTODIA
            </span>
            <Database className="h-4 w-4 text-black" />
          </div>
          <div className="text-[32px] font-medium text-black tracking-[-0.836px]">
            {items.length}
          </div>
          <span className="text-[12px] text-[#b5b5b5]">Registros activos e históricos</span>
        </div>

        <div className="bg-white p-5">
          <div className="flex items-center justify-between text-[#b5b5b5] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              TABLA: USUARIOS (RBAC)
            </span>
            <Table className="h-4 w-4 text-black" />
          </div>
          <div className="text-[32px] font-medium text-black tracking-[-0.836px]">
            {users.length}
          </div>
          <span className="text-[12px] text-[#b5b5b5]">Cuentas Admin, Empleado y Cliente</span>
        </div>

        <div className="bg-white p-5">
          <div className="flex items-center justify-between text-[#b5b5b5] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              TABLA: REPORTES_CIUDADANOS
            </span>
            <Table className="h-4 w-4 text-black" />
          </div>
          <div className="text-[32px] font-medium text-black tracking-[-0.836px]">
            {reports.length}
          </div>
          <span className="text-[12px] text-[#b5b5b5]">Pérdidas y hallazgos radicados</span>
        </div>

        <div className="bg-white p-5">
          <div className="flex items-center justify-between text-[#b5b5b5] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              SERVIDOR XAMPP MYSQL
            </span>
            <HardDrive className="h-4 w-4 text-black" />
          </div>
          <div className="text-[14px] font-mono font-medium text-black mt-1">
            mysql://root@127.0.0.1:3306
          </div>
          <div className="text-[13px] font-mono text-[#b5b5b5]">
            DB: custodia_sena_db
          </div>
          <span className="text-[11px] text-[#b5b5b5] block mt-1">
            SQL: database/custodia_sena_xampp.sql
          </span>
        </div>
      </div>

      {/* Selector de Tabla y Consola API REST / JWT / RBAC */}
      <div className="rounded-[2px] bg-white border border-[#ebebeb] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#ebebeb]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTable('rest_api')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition flex items-center gap-1.5 cursor-pointer ${
                selectedTable === 'rest_api'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>API REST · JWT Auth & RBAC</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTable('objetos_custodia')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
                selectedTable === 'objetos_custodia'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black'
              }`}
            >
              objetos_custodia ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedTable('usuarios')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
                selectedTable === 'usuarios'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black'
              }`}
            >
              usuarios ({users.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedTable('reportes_ciudadanos')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
                selectedTable === 'reportes_ciudadanos'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black'
              }`}
            >
              reportes_ciudadanos ({reports.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedTable('intentos_fallidos')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition cursor-pointer ${
                selectedTable === 'intentos_fallidos'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black'
              }`}
            >
              intentos_fallidos_cliente ({allFailedAttempts.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedTable('sql_schema')}
              className={`rounded-full px-4 py-1.5 text-[13px] transition flex items-center gap-1.5 cursor-pointer ${
                selectedTable === 'sql_schema'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Estructura SQL (`database/schema.sql`)</span>
            </button>
          </div>
        </div>

        {/* Contenido de la Tabla o Consola API REST Seleccionada */}
        {selectedTable === 'rest_api' && (
          <div className="space-y-6">
            {/* 1. Inspector de Token JWT (Autenticación) y Permisos RBAC (Autorización) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 rounded-[2px] bg-[#f7f7f7] p-4 border border-[#ebebeb] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-black flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    AUTENTICACIÓN JWT (JSON WEB TOKEN · HMAC-SHA256)
                  </span>
                  <span className="rounded-full bg-black text-white px-2.5 py-0.5 text-[10px] font-mono">
                    Bearer Token Activo
                  </span>
                </div>

                <div className="bg-white p-3 rounded-[2px] border border-[#ebebeb] font-mono text-[11px] break-all text-black max-h-24 overflow-y-auto">
                  {jwtToken || 'Sesión iniciada con token Bearer activo'}
                </div>

                {decodedJwt && (
                  <div className="bg-white p-3 rounded-[2px] border border-[#ebebeb] font-mono text-[11px] text-black">
                    <span className="text-[#b5b5b5] block mb-1">// Payload JWT Decodificado:</span>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(decodedJwt, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 rounded-[2px] bg-[#f7f7f7] p-4 border border-[#ebebeb] space-y-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-black flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  AUTORIZACIÓN RBAC · PERMISOS DEL ROL ({currentUser?.role.toUpperCase()})
                </span>
                <p className="text-[12px] text-[#b5b5b5]">
                  Permisos otorgados por el middleware de autorización para tu sesión actual:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activePermissions.map((perm) => (
                    <span
                      key={perm}
                      className="rounded-full bg-white border border-[#ebebeb] px-3 py-1 font-mono text-[11px] text-black"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Probador Interactivo de Endpoints API REST (/api/v1/...) */}
            <div className="rounded-[2px] border border-[#ebebeb] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-[15px] font-medium text-black">
                    Endpoints API REST Disponibles (`/api/v1/...`)
                  </h4>
                  <p className="text-[12px] text-[#b5b5b5]">
                    Haz clic en &quot;Probar Endpoint&quot; para enviar una petición real con tu cabecera <code className="text-black font-mono">Authorization: Bearer &lt;token&gt;</code>:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center justify-between p-3 rounded-[2px] bg-[#f7f7f7] border border-[#ebebeb]">
                  <div>
                    <span className="font-mono font-bold text-black">GET /api/v1/auth/me</span>
                    <p className="text-[11px] text-[#b5b5b5]">Verifica firma JWT y retorna permisos RBAC</p>
                  </div>
                  <button
                    type="button"
                    disabled={isTestingApi}
                    onClick={() => handleTestEndpoint('GET', '/api/v1/auth/me')}
                    className="rounded-full bg-black text-white px-3.5 py-1.5 text-[11px] font-medium hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Probar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[2px] bg-[#f7f7f7] border border-[#ebebeb]">
                  <div>
                    <span className="font-mono font-bold text-black">GET /api/v1/items/public</span>
                    <p className="text-[11px] text-[#b5b5b5]">Catálogo público (oculta claves de seguridad)</p>
                  </div>
                  <button
                    type="button"
                    disabled={isTestingApi}
                    onClick={() => handleTestEndpoint('GET', '/api/v1/items/public')}
                    className="rounded-full bg-black text-white px-3.5 py-1.5 text-[11px] font-medium hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Probar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[2px] bg-[#f7f7f7] border border-[#ebebeb]">
                  <div>
                    <span className="font-mono font-bold text-black">GET /api/v1/items</span>
                    <p className="text-[11px] text-[#b5b5b5]">Expediente completo (Requiere rol employee o admin)</p>
                  </div>
                  <button
                    type="button"
                    disabled={isTestingApi}
                    onClick={() => handleTestEndpoint('GET', '/api/v1/items')}
                    className="rounded-full bg-black text-white px-3.5 py-1.5 text-[11px] font-medium hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Probar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[2px] bg-[#f7f7f7] border border-[#ebebeb]">
                  <div>
                    <span className="font-mono font-bold text-black">GET /api/v1/users</span>
                    <p className="text-[11px] text-[#b5b5b5]">Directorio RBAC (Exclusivo rol admin · 403 a empleado)</p>
                  </div>
                  <button
                    type="button"
                    disabled={isTestingApi}
                    onClick={() => handleTestEndpoint('GET', '/api/v1/users')}
                    className="rounded-full bg-black text-white px-3.5 py-1.5 text-[11px] font-medium hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Probar</span>
                  </button>
                </div>
              </div>

              {apiTestResult && (
                <div className="rounded-[2px] bg-black text-white p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span>
                      {apiTestResult.method} {apiTestResult.endpoint}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        apiTestResult.status >= 200 && apiTestResult.status < 300
                          ? 'bg-white text-black'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      HTTP {apiTestResult.status}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto text-[11px] text-neutral-300">
                    {JSON.stringify(apiTestResult.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTable === 'objetos_custodia' && (
          <div className="space-y-3">
            {onOpenCreateItem && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onOpenCreateItem}
                  className="rounded-full bg-black text-white px-4 py-1.5 text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
                >
                  + Crear Objeto (CRUD CREATE)
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-[11px] uppercase tracking-[0.14em] text-[#b5b5b5]">
                    <th className="py-3 px-3">ID / Código</th>
                    <th className="py-3 px-3">Título</th>
                    <th className="py-3 px-3">Marca</th>
                    <th className="py-3 px-3">Color</th>
                    <th className="py-3 px-3">Casillero</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Acciones CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f7f7f7]">
                      <td className="py-2.5 px-3 font-mono font-medium text-black">
                        {item.trackingCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-black">{item.title}</td>
                      <td className="py-2.5 px-3 text-black uppercase tracking-[0.1em] text-[11px]">
                        {item.brand}
                      </td>
                      <td className="py-2.5 px-3 text-[#b5b5b5]">{item.color}</td>
                      <td className="py-2.5 px-3 font-mono text-black">
                        {item.location.lockerNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded-full bg-[#f7f7f7] border border-[#ebebeb] px-2.5 py-0.5 text-[10px] font-medium">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {onDeleteItem && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar [${item.trackingCode} - ${item.title}] de MySQL XAMPP?`
                                )
                              ) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="rounded-full border border-red-200 hover:border-red-600 bg-red-50 px-2.5 py-0.5 text-[10px] font-medium text-red-700 cursor-pointer"
                          >
                            DELETE
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTable === 'usuarios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[11px] uppercase tracking-[0.14em] text-[#b5b5b5]">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Correo</th>
                  <th className="py-3 px-3">Rol (RBAC)</th>
                  <th className="py-3 px-3">Credencial / Placa</th>
                  <th className="py-3 px-3">Departamento</th>
                  <th className="py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f7f7f7]">
                    <td className="py-2.5 px-3 font-mono text-[#b5b5b5]">{u.id}</td>
                    <td className="py-2.5 px-3 font-medium text-black">{u.name}</td>
                    <td className="py-2.5 px-3 font-mono text-black">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="rounded-full bg-black text-white px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]">
                        {u.role === 'user' ? 'CLIENTE (user)' : u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#b5b5b5]">
                      {u.badgeNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[#b5b5b5]">{u.department || '—'}</td>
                    <td className="py-2.5 px-3 font-medium text-black">
                      {u.status || 'ACTIVO'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTable === 'reportes_ciudadanos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[11px] uppercase tracking-[0.14em] text-[#b5b5b5]">
                  <th className="py-3 px-3">Radicado</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Ciudadano</th>
                  <th className="py-3 px-3">Objeto Reportado</th>
                  <th className="py-3 px-3">Lugar Estimado</th>
                  <th className="py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f7f7f7]">
                    <td className="py-2.5 px-3 font-mono font-medium text-black">{r.id}</td>
                    <td className="py-2.5 px-3 font-mono text-black">{r.reportType}</td>
                    <td className="py-2.5 px-3 text-black">
                      {r.fullName} ({r.phone})
                    </td>
                    <td className="py-2.5 px-3 font-medium text-black">{r.title}</td>
                    <td className="py-2.5 px-3 text-[#b5b5b5]">{r.estimatedLostPlace}</td>
                    <td className="py-2.5 px-3">
                      <span className="rounded-full bg-[#f7f7f7] border border-[#ebebeb] px-2.5 py-0.5 text-[10px] font-medium">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTable === 'intentos_fallidos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ebebeb] text-[11px] uppercase tracking-[0.14em] text-[#b5b5b5]">
                  <th className="py-3 px-3">ID Intento</th>
                  <th className="py-3 px-3">Objeto</th>
                  <th className="py-3 px-3">Cliente (ID / Correo)</th>
                  <th className="py-3 px-3">Porcentaje</th>
                  <th className="py-3 px-3">Motivo</th>
                  <th className="py-3 px-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebebeb]">
                {allFailedAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-[#f7f7f7]">
                    <td className="py-2.5 px-3 font-mono text-[#b5b5b5]">{att.id}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-black">
                      {att.itemCode}
                    </td>
                    <td className="py-2.5 px-3 text-black">
                      <strong>{att.claimantName}</strong>{' '}
                      <span className="text-[#b5b5b5] font-mono">
                        ({att.userEmail || att.userId || 'Registro histórico'})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-black">
                      {att.percentageScore}%
                    </td>
                    <td className="py-2.5 px-3 text-[#b5b5b5] max-w-md truncate">
                      {att.reason}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#b5b5b5]">{att.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTable === 'sql_schema' && (
          <div className="rounded-[2px] bg-[#f7f7f7] p-4 border border-[#ebebeb] font-mono text-xs overflow-x-auto text-black leading-relaxed">
            <p className="text-[#b5b5b5] mb-2">
              // Archivo físico creado en el proyecto: database/schema.sql y database/db.json
            </p>
            <pre className="whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'user',
  placa_credencial VARCHAR(50),
  departamento VARCHAR(150),
  estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE IF NOT EXISTS objetos_custodia (
  id VARCHAR(64) PRIMARY KEY,
  codigo_seguimiento VARCHAR(64) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  color VARCHAR(80) NOT NULL,
  estado VARCHAR(40) NOT NULL DEFAULT 'EN_CUSTODIA',
  numero_casillero VARCHAR(20) NOT NULL,
  numero_precinto VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS intentos_fallidos_cliente (
  id VARCHAR(64) PRIMARY KEY,
  objeto_id VARCHAR(64) NOT NULL REFERENCES objetos_custodia(id),
  usuario_id VARCHAR(64),
  correo_cliente VARCHAR(150),
  nombre_reclamante VARCHAR(150) NOT NULL,
  porcentaje_coincidencia INTEGER NOT NULL,
  motivo_fallo TEXT NOT NULL
);`}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
