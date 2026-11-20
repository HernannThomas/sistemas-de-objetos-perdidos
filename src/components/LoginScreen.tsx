import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  KeyRound,
  UserPlus,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SessionUser } from '../types/custody';
import { restApi } from '../services/apiClient';
import { sfx } from '../utils/audio';

interface LoginScreenProps {
  users: SessionUser[];
  initialTab?: 'login' | 'register';
  onLogin: (user: SessionUser) => void;
  onRegister: (newUser: SessionUser) => void;
  onBackToLanding?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  initialTab = 'login',
  onLogin,
  onRegister,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg(null);
  }, [initialTab]);

  // Estados de Login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Estados de Registro "Crea tu cuenta"
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = emailInput.toLowerCase().trim();
    if (!cleanEmail || !passwordInput) {
      setErrorMsg('Por favor ingresa tu correo electrónico y tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authRes = await restApi.login(cleanEmail, passwordInput, users);
      if (!authRes.ok || !authRes.user) {
        setErrorMsg(
          authRes.error ||
            'Credenciales inválidas. Verifica tu correo y contraseña.'
        );
        return;
      }

      sfx.playVerificationSuccess();
      onLogin(authRes.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.toLowerCase().trim();

    if (!cleanName || !cleanEmail || !regPassword) {
      setErrorMsg(
        'Por favor completa todos los campos obligatorios (Nombre, Correo y Contraseña).'
      );
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const regRes = await restApi.register(
        {
          name: cleanName,
          email: cleanEmail,
          password: regPassword,
          phone: regPhone.trim() || undefined,
          idNumber: regIdNumber.trim() || undefined,
        },
        users
      );

      if (!regRes.ok || !regRes.user) {
        setErrorMsg(
          regRes.error || 'No fue posible registrar la cuenta. Intenta de nuevo.'
        );
        return;
      }

      sfx.playVerificationSuccess();
      onRegister(regRes.user);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'ADMIN';
    if (role === 'employee') return 'EMPLEADO';
    return 'CLIENTE';
  };

  return (
    <div className="min-h-screen w-full bg-[#ebebeb] text-black flex flex-col">
      {/* Cobalt Announcement Strip — Sole chromatic accent */}
      <div className="w-full h-8 bg-[#0700ff] text-white flex items-center justify-center px-4">
        <p className="text-[13px] font-normal tracking-[-0.14px] text-center truncate">
          Custodia.Space · SENA CIES Neiva · Control de Acceso Institucional (ADSO 3413988)
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-[2px] bg-white p-8 border border-[#ebebeb]">
          {/* Enlace para volver a la página de Inicio */}
          {onBackToLanding && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onBackToLanding();
                }}
                className="rounded-full border border-[#ebebeb] hover:border-black px-3.5 py-1.5 text-[13px] font-normal text-black transition cursor-pointer"
              >
                ← Volver a la Galería de Inicio
              </button>
            </div>
          )}

          {/* Cabecera Basic.Space */}
          <div className="mb-8">
            <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5] block mb-2">
              CUSTODIA.SPACE · SENA
            </span>
            <h2 className="text-[32px] font-medium text-black leading-[1.13] tracking-[-0.836px]">
              {activeTab === 'login' ? 'Iniciar Sesión' : 'Crea tu cuenta'}
            </h2>
            <p className="text-[14px] text-[#b5b5b5] mt-1.5">
              {activeTab === 'login'
                ? 'Accede con tus credenciales registradas.'
                : 'Toda cuenta nueva se registra con rol inicial de Cliente.'}
            </p>
          </div>

          {/* Pestañas Pill: Iniciar Sesión vs Crea tu Cuenta */}
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-[#ebebeb]">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`rounded-full px-5 py-2 text-[14px] transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`rounded-full px-5 py-2 text-[14px] transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb] hover:border-black font-normal'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Crea tu cuenta</span>
            </button>
          </div>

          {/* Alerta de Error en Línea */}
          {errorMsg && (
            <div className="mb-6 rounded-[2px] bg-[#f7f7f7] border border-black p-3.5 text-[13px] text-black flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-black shrink-0 mt-0.5" />
              <span className="font-normal leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="usuario@sena.edu.co"
                      required
                      className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] pl-4 pr-10 py-2.5 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <Mail className="absolute right-3.5 top-3 h-4 w-4 text-[#b5b5b5]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Ingresa tu contraseña"
                      required
                      className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] pl-4 pr-10 py-2.5 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3.5 top-3 text-[#b5b5b5] hover:text-black cursor-pointer"
                    >
                      {showLoginPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-3 text-[14px] font-medium text-white hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Cuentas Registradas (Autocompletar rápido para evaluación) */}
              <div className="mt-8 pt-6 border-t border-[#ebebeb]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#b5b5b5]">
                    DIRECTORIO DE CUENTAS (CLIC PARA COMPLETAR)
                  </span>
                  <KeyRound className="h-3.5 w-3.5 text-[#b5b5b5]" />
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEmailInput(u.email);
                        setPasswordInput(u.password || '123456');
                        setErrorMsg(null);
                      }}
                      className="w-full text-left p-2.5 rounded-[2px] border border-[#ebebeb] bg-[#f7f7f7] hover:border-black hover:bg-white transition flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <span className="font-medium text-black block truncate">
                          {u.name}
                        </span>
                        <span className="font-mono text-[11px] text-[#b5b5b5]">
                          {u.email} · Clave: {u.password || '123456'}
                        </span>
                      </div>
                      <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.14em] bg-black text-white">
                        {getRoleLabel(u.role)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* FORMULARIO DE REGISTRO: CREA TU CUENTA */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="rounded-[2px] bg-[#f7f7f7] p-3.5 border border-[#ebebeb] text-[13px] text-black">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] block mb-1">
                  PERFIL INICIAL: CLIENTE
                </span>
                <p className="text-[12px] text-[#b5b5b5] leading-relaxed">
                  Tu cuenta será creada con rol de <strong>Cliente</strong>. El Administrador puede promover roles desde el módulo de usuarios (RF-02).
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Andrés Morales"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                    Documento
                  </label>
                  <input
                    type="text"
                    placeholder="1075392819"
                    value={regIdNumber}
                    onChange={(e) => setRegIdNumber(e.target.value)}
                    className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+57 312 456 7890"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu.correo@ejemplo.com"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2.5 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      required
                      placeholder="Mín. 4 caracteres"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] pl-4 pr-9 py-2 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3 top-2.5 text-[#b5b5b5] hover:text-black cursor-pointer"
                    >
                      {showRegPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-[0.14em] text-black mb-1.5">
                    Confirmar *
                  </label>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    placeholder="Repite la clave"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] px-4 py-2 text-[14px] text-black placeholder-[#b5b5b5] focus:border-black focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-3 text-[14px] font-medium text-white hover:bg-neutral-800 transition cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Crear Cuenta de Cliente</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
