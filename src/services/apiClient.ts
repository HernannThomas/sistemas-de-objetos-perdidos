import { SessionUser, CustodyItem, CitizenLostReport, UserRole } from '../types/custody';

const JWT_STORAGE_KEY = 'sop_sena_jwt_token_v1';

export interface AuthResponse {
  ok: boolean;
  token: string;
  tokenType: 'Bearer';
  expiresIn: string;
  permissions: string[];
  user: SessionUser;
  error?: string;
}

export function getStoredJwtToken(): string | null {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredJwtToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(JWT_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function decodeJwtPayload(token: string | null): {
  sub?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  permissions?: string[];
  iat?: number;
  exp?: number;
} | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Genera un JWT local de respaldo si se ejecuta sin backend
 */
function createFallbackJwt(user: SessionUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const now = Math.floor(Date.now() / 1000);
  const permissions = getRolePermissions(user.role);
  const payload = btoa(
    unescape(
      encodeURIComponent(
        JSON.stringify({
          sub: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions,
          iat: now,
          exp: now + 28800,
          iss: 'custodia.space.sena.edu.co',
        })
      )
    )
  ).replace(/=/g, '');
  const signature = btoa(`HMAC_SHA256_${user.id}_${user.role}_${now}`).replace(/=/g, '');
  return `${header}.${payload}.${signature}`;
}

export function getRolePermissions(role: UserRole): string[] {
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
  return [
    'items:read:public',
    'items:claim_attempt',
    'reports:read:own',
    'reports:write',
  ];
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; ok: boolean; data: T }> {
  const token = getStoredJwtToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, ok: res.ok, data };
}

export const restApi = {
  /**
   * POST /api/v1/auth/login — Autenticación con emisión de Token JWT
   */
  async login(
    email: string,
    password: string,
    fallbackUsers: SessionUser[]
  ): Promise<AuthResponse> {
    try {
      const { ok, data } = await apiRequest<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (ok && data.token && data.user) {
        setStoredJwtToken(data.token);
        return data;
      }
      if (data?.error) {
        return {
          ok: false,
          token: '',
          tokenType: 'Bearer',
          expiresIn: '0',
          permissions: [],
          user: null as unknown as SessionUser,
          error: data.error,
        };
      }
    } catch {
      // Fallback local si el endpoint no está disponible
    }

    const cleanEmail = email.toLowerCase().trim();
    const matched = fallbackUsers.find(
      (u) => u.email.toLowerCase().trim() === cleanEmail
    );
    if (!matched) {
      return {
        ok: false,
        token: '',
        tokenType: 'Bearer',
        expiresIn: '0',
        permissions: [],
        user: null as unknown as SessionUser,
        error:
          'No se encontró ninguna cuenta asociada a este correo electrónico. Verifica el correo o regístrate en "Crea tu cuenta".',
      };
    }
    if (matched.status === 'INACTIVO') {
      return {
        ok: false,
        token: '',
        tokenType: 'Bearer',
        expiresIn: '0',
        permissions: [],
        user: null as unknown as SessionUser,
        error: 'Esta cuenta se encuentra inactiva por disposición administrativa.',
      };
    }
    if (matched.password && matched.password !== password) {
      return {
        ok: false,
        token: '',
        tokenType: 'Bearer',
        expiresIn: '0',
        permissions: [],
        user: null as unknown as SessionUser,
        error: 'La contraseña ingresada es incorrecta.',
      };
    }

    const token = createFallbackJwt(matched);
    setStoredJwtToken(token);
    return {
      ok: true,
      token,
      tokenType: 'Bearer',
      expiresIn: '8h',
      permissions: getRolePermissions(matched.role),
      user: matched,
    };
  },

  /**
   * POST /api/v1/auth/register — Registro de usuario con rol inicial 'user' (Cliente) y emisión de JWT
   */
  async register(
    payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      idNumber?: string;
    },
    fallbackUsers: SessionUser[]
  ): Promise<AuthResponse> {
    try {
      const { ok, data } = await apiRequest<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (ok && data.token && data.user) {
        setStoredJwtToken(data.token);
        return data;
      }
      if (data?.error) {
        return {
          ok: false,
          token: '',
          tokenType: 'Bearer',
          expiresIn: '0',
          permissions: [],
          user: null as unknown as SessionUser,
          error: data.error,
        };
      }
    } catch {
      // Fallback local
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    if (fallbackUsers.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      return {
        ok: false,
        token: '',
        tokenType: 'Bearer',
        expiresIn: '0',
        permissions: [],
        user: null as unknown as SessionUser,
        error: 'Ya existe una cuenta registrada con este correo electrónico.',
      };
    }

    const newUser: SessionUser = {
      id: 'user-client-' + Date.now(),
      name: payload.name.trim(),
      email: cleanEmail,
      password: payload.password,
      role: 'user', // Rol inicial Cliente obligatorio
      badgeNumber: 'CLIENTE-' + Math.floor(1000 + Math.random() * 9000),
      rank: 'Cliente / Ciudadano',
      phone: payload.phone?.trim() || undefined,
      idNumber: payload.idNumber?.trim() || undefined,
      department: 'Comunidad Educativa y Clientes',
      createdAt: new Date().toLocaleDateString('es-CO'),
      status: 'ACTIVO',
    };

    const token = createFallbackJwt(newUser);
    setStoredJwtToken(token);
    return {
      ok: true,
      token,
      tokenType: 'Bearer',
      expiresIn: '8h',
      permissions: getRolePermissions('user'),
      user: newUser,
    };
  },

  /**
   * Cierra la sesión y revoca el token JWT del cliente
   */
  logout(): void {
    setStoredJwtToken(null);
  },

  /**
   * Verifica si el usuario autenticado posee un permiso RBAC específico
   */
  hasPermission(user: SessionUser | null, permission: string): boolean {
    if (!user) return false;
    const perms = getRolePermissions(user.role);
    return perms.includes(permission);
  },
};
