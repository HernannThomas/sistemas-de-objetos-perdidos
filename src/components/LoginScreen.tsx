import React, { useState } from 'react';
import {
  Boxes,
  ShieldCheck,
  Lock,
  User,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SessionUser, UserRole } from '../types/custody';
import { sfx } from '../utils/audio';

interface LoginScreenProps {
  onLogin: (user: SessionUser) => void;
}

const PRESET_USERS: Record<UserRole, SessionUser> = {
  admin: {
    id: 'user-admin-1',
    name: 'Cap. Roberto Hernández',
    role: 'admin',
    badgeNumber: '0104-CMD',
    rank: 'Superintendente de Seguridad',
    email: 'r.hernandez@seguridad.estacion.gob',
    department: 'Mando Central y Asuntos Judiciales',
  },
  employee: {
    id: 'user-employee-1',
    name: 'Ofc. Javier Martínez',
    role: 'employee',
    badgeNumber: '8921-SEC',
    rank: 'Oficial de Triaje y Custodia',
    email: 'j.martinez@custodia.estacion.gob',
    department: 'Mostrador de Recepción · Terminal B',
  },
  user: {
    id: 'user-citizen-1',
    name: 'Elena Gutiérrez Valle',
    role: 'user',
    badgeNumber: 'DNI-53892104M',
    rank: 'Ciudadana / Reclamante',
    email: 'elena.gutierrez@correo.com',
    department: 'Portal Público de Propiedad Extraviada',
  },
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [email, setEmail] = useState(PRESET_USERS.employee.email);
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(PRESET_USERS[role].email);
    setPassword('custodia2026');
    sfx.playScannerBeep();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playVerificationSuccess();
    onLogin(PRESET_USERS[selectedRole]);
  };

  const handleQuickLogin = (role: UserRole) => {
    sfx.playVerificationSuccess();
    onLogin(PRESET_USERS[role]);
  };

  return (
    <div className="min-h-screen bg-[#0b1c30] flex flex-col justify-between text-slate-100 font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Barra superior de acreditación */}
      <div className="border-b border-slate-800 bg-[#071322] px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
          <span className="font-mono tracking-wider text-slate-300 uppercase">
            RED INSTITUCIONAL DE CONTROL DE CUSTODIA · ACCESO IDENTIFICADO
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 font-mono text-[11px] text-slate-500">
          <span>PROTOCOLO TLS 1.3 / ENCRIPTACIÓN SHA-256</span>
          <span>ESTACIÓN CENTRAL</span>
        </div>
      </div>

      {/* Contenedor Central */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden text-slate-900 grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Columna Izquierda: Información Institucional y Perfiles Rápidos (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F172A] p-6 sm:p-8 text-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  className="h-11 w-11 rounded-lg bg-[#1E3A8A] flex items-center justify-center shadow-inner ring-1 ring-white/20 text-sky-400 cursor-pointer"
                >
                  <Boxes className="h-6 w-6" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                    CUSTODIA CORE
                  </h1>
                  <span className="text-[10px] font-mono tracking-wider text-sky-300 uppercase">
                    Control de Evidencias
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-300 leading-relaxed">
                Plataforma de alta seguridad para la trazabilidad inalterable de bienes hallados, retenciones policiales y entregas a ciudadanos.
              </p>

              {/* Selector de Perfiles para Demostración / Acceso Rápido */}
              <div className="mt-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Seleccionar Perfil de Acceso:
                </span>
                <div className="space-y-2">
                  {/* Administrador */}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center gap-3 ${
                      selectedRole === 'admin'
                        ? 'border-sky-500 bg-[#1E3A8A]/70 text-white shadow-md ring-1 ring-sky-400/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="h-8 w-8 rounded bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Administrador</span>
                        <span className="font-mono text-[10px] text-red-400 font-semibold">Mando Central</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Cap. Roberto Hernández (#0104-CMD)</p>
                    </div>
                  </motion.button>

                  {/* Empleado */}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleRoleSelect('employee')}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center gap-3 ${
                      selectedRole === 'employee'
                        ? 'border-sky-500 bg-[#1E3A8A]/70 text-white shadow-md ring-1 ring-sky-400/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="h-8 w-8 rounded bg-sky-950/80 border border-sky-800 flex items-center justify-center text-sky-400 shrink-0">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Empleado</span>
                        <span className="font-mono text-[10px] text-emerald-400 font-semibold">Oficial Mostrador</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Ofc. Javier Martínez (#8921-SEC)</p>
                    </div>
                  </motion.button>

                  {/* Usuario / Ciudadano */}
                  <motion.button
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleRoleSelect('user')}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center gap-3 ${
                      selectedRole === 'user'
                        ? 'border-sky-500 bg-[#1E3A8A]/70 text-white shadow-md ring-1 ring-sky-400/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="h-8 w-8 rounded bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Usuario / Ciudadano</span>
                        <span className="font-mono text-[10px] text-indigo-300 font-semibold">Portal Reclamante</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Elena Gutiérrez (DNI 53.892.104-M)</p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5 text-slate-500 animate-pulse" />
              <span>Acceso seguro con verificación de credenciales oficiales</span>
            </div>
          </div>

          {/* Columna Derecha: Formulario de Autenticación (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A] font-heading">
                    Portal de Inicio de Sesión
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ingrese con sus credenciales institucionales o de ciudadano
                  </p>
                </div>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-semibold uppercase">
                  Rol: {selectedRole === 'admin' ? 'Administrador' : selectedRole === 'employee' ? 'Empleado' : 'Usuario'}
                </span>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Selector de Rol en Formulario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Usuario / Perfil de Acceso
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors"
                  >
                    <option value="admin">Administrador (Superintendente / Control Total)</option>
                    <option value="employee">Empleado (Oficial de Recepción y Casilleros)</option>
                    <option value="user">Usuario (Ciudadano / Consulta de Bienes)</option>
                  </select>
                </div>

                {/* Email / Usuario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identificador Oficial / Correo Electrónico
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@estacion.gob"
                      className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 font-mono focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña de Acceso
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-10 text-xs text-slate-800 font-mono focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Resumen del perfil activo con AnimatePresence */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedRole}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-1 mb-1.5 font-mono">
                      <span>TITULAR ACREDITADO</span>
                      <span>{PRESET_USERS[selectedRole].badgeNumber}</span>
                    </div>
                    <p className="font-semibold text-slate-900">{PRESET_USERS[selectedRole].name}</p>
                    <p className="text-[11px] text-slate-500">{PRESET_USERS[selectedRole].department}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Botón Principal de Ingreso */}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-[#0F172A] py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-[#1E293B] transition"
                >
                  <span>Iniciar Sesión como {selectedRole === 'admin' ? 'Administrador' : selectedRole === 'employee' ? 'Empleado' : 'Usuario'}</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </form>
            </div>

            {/* Accesos Directos 1-Click con microanimaciones */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                Acceso Rápido de Prueba (1 Clic):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="p-1.5 rounded border border-red-200 bg-red-50 text-red-800 text-[11px] font-semibold hover:bg-red-100 transition truncate shadow-xs"
                >
                  Entrar Admin
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleQuickLogin('employee')}
                  className="p-1.5 rounded border border-sky-200 bg-sky-50 text-sky-800 text-[11px] font-semibold hover:bg-sky-100 transition truncate shadow-xs"
                >
                  Entrar Empleado
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleQuickLogin('user')}
                  className="p-1.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-800 text-[11px] font-semibold hover:bg-indigo-100 transition truncate shadow-xs"
                >
                  Entrar Usuario
                </motion.button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Pie de página institucional */}
      <div className="border-t border-slate-800/80 bg-[#071322] px-6 py-3 text-center text-[11px] text-slate-500">
        Custodia Core v2.4 · Sistema Homologado para Custodia Judicial, Control Policial y Recepción Ciudadana de Bienes Extraviados.
      </div>
    </div>
  );
};
