import { CustodyItem, SessionUser, CitizenLostReport } from '../types/custody';
import { INITIAL_CUSTODY_ITEMS } from '../data/mockItems';
import { INITIAL_USERS, INITIAL_CITIZEN_REPORTS } from '../data/initialUsersAndReports';

export interface ProjectDatabaseSchema {
  metadata: {
    databaseName: string;
    engine: string;
    filePath: string;
    sqlSchemaPath: string;
    ficha: string;
    lastUpdated: string;
    version: string;
  };
  tables: {
    usuarios: SessionUser[];
    objetos_custodia: CustodyItem[];
    reportes_ciudadanos: CitizenLostReport[];
  };
}

const STORAGE_USERS_KEY = 'sop_sena_users_v4';
const STORAGE_ITEMS_KEY = 'sop_sena_items_v4';
const STORAGE_REPORTS_KEY = 'sop_sena_reports_v4';

export const createInitialDatabasePayload = (): ProjectDatabaseSchema => ({
  metadata: {
    databaseName: 'custodia_sena_db',
    engine: 'Local File JSON DB + SQL Schema (Vite Middleware)',
    filePath: 'database/db.json',
    sqlSchemaPath: 'database/schema.sql',
    ficha: 'ADSO 3413988 · SENA Regional Huila',
    lastUpdated: new Date().toISOString(),
    version: '4.0.0',
  },
  tables: {
    usuarios: INITIAL_USERS,
    objetos_custodia: INITIAL_CUSTODY_ITEMS,
    reportes_ciudadanos: INITIAL_CITIZEN_REPORTS,
  },
});

/**
 * Carga la base de datos desde el archivo del proyecto (/database/db.json vía /api/db)
 * con respaldo en localStorage si se ejecuta en modo estático.
 */
export async function loadProjectDatabase(): Promise<{
  users: SessionUser[];
  items: CustodyItem[];
  citizenReports: CitizenLostReport[];
  connectedToFile: boolean;
  lastUpdated: string;
}> {
  try {
    const res = await fetch('/api/db', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as ProjectDatabaseSchema;
      if (
        data?.tables?.usuarios &&
        data?.tables?.objetos_custodia &&
        data?.tables?.reportes_ciudadanos
      ) {
        return {
          users: data.tables.usuarios,
          items: data.tables.objetos_custodia,
          citizenReports: data.tables.reportes_ciudadanos,
          connectedToFile: true,
          lastUpdated: data.metadata?.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback a localStorage si /api/db no responde
  }

  const localUsers = (() => {
    try {
      const s = localStorage.getItem(STORAGE_USERS_KEY);
      return s ? (JSON.parse(s) as SessionUser[]) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  })();

  const localItems = (() => {
    try {
      const s = localStorage.getItem(STORAGE_ITEMS_KEY);
      return s ? (JSON.parse(s) as CustodyItem[]) : INITIAL_CUSTODY_ITEMS;
    } catch {
      return INITIAL_CUSTODY_ITEMS;
    }
  })();

  const localReports = (() => {
    try {
      const s = localStorage.getItem(STORAGE_REPORTS_KEY);
      return s ? (JSON.parse(s) as CitizenLostReport[]) : INITIAL_CITIZEN_REPORTS;
    } catch {
      return INITIAL_CITIZEN_REPORTS;
    }
  })();

  return {
    users: localUsers,
    items: localItems,
    citizenReports: localReports,
    connectedToFile: false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Persiste los cambios directamente en el archivo físico /database/db.json del proyecto
 * y sincroniza con localStorage.
 */
export async function saveProjectDatabase(
  users: SessionUser[],
  items: CustodyItem[],
  citizenReports: CitizenLostReport[]
): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(citizenReports));
  } catch {
    // Ignorar límite de cuota local
  }

  const payload: ProjectDatabaseSchema = {
    metadata: {
      databaseName: 'custodia_sena_db',
      engine: 'Local File JSON DB + SQL Schema (Vite Middleware)',
      filePath: 'database/db.json',
      sqlSchemaPath: 'database/schema.sql',
      ficha: 'ADSO 3413988 · SENA Regional Huila',
      lastUpdated: new Date().toISOString(),
      version: '4.0.0',
    },
    tables: {
      usuarios: users,
      objetos_custodia: items,
      reportes_ciudadanos: citizenReports,
    },
  };

  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
