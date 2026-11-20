import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Extraer objetos desde mockItems.ts e initialUsersAndReports.ts compilando o evaluando
const mockItemsSrc = fs.readFileSync(path.join(rootDir, 'src/data/mockItems.ts'), 'utf-8');
const usersReportsSrc = fs.readFileSync(path.join(rootDir, 'src/data/initialUsersAndReports.ts'), 'utf-8');

const cleanMock = mockItemsSrc
  .replace(/import\s+.*?;[\r\n]*/g, '')
  .replace(/export\s+const\s+INITIAL_CUSTODY_ITEMS\s*:\s*CustodyItem\[\]\s*=\s*/, 'return ');

const cleanUsers = usersReportsSrc
  .replace(/import\s+.*?;[\r\n]*/g, '')
  .replace(/export\s+const\s+INITIAL_CITIZEN_REPORTS\s*:\s*CitizenLostReport\[\]\s*=\s*/, 'const INITIAL_CITIZEN_REPORTS = ')
  .replace(/export\s+const\s+INITIAL_USERS\s*:\s*SessionUser\[\]\s*=\s*/, 'const INITIAL_USERS = ') +
  '\nreturn { INITIAL_USERS, INITIAL_CITIZEN_REPORTS };';

const items = new Function(cleanMock)();
const { INITIAL_USERS, INITIAL_CITIZEN_REPORTS } = new Function(cleanUsers)();

const dbPayload = {
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
    objetos_custodia: items,
    reportes_ciudadanos: INITIAL_CITIZEN_REPORTS,
  },
};

fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(dbPayload, null, 2), 'utf-8');
console.log(`Base de datos física generada en database/db.json (${items.length} objetos, ${INITIAL_USERS.length} usuarios, ${INITIAL_CITIZEN_REPORTS.length} reportes).`);
