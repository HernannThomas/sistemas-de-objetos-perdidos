import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Barcode,
  Radio,
  Plus,
  LayoutGrid,
  History,
  Boxes,
  Lock,
  LogOut,
  Shield,
  UserCheck,
} from 'lucide-react';
import { SessionUser } from '../types/custody';
import { sfx } from '../utils/audio';

interface HeaderProps {
  currentUser: SessionUser;
  onLogout: () => void;
  currentTab: 'queue' | 'lockers' | 'audit';
  onTabChange: (tab: 'queue' | 'lockers' | 'audit') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenIntake: () => void;
  onQuickScanCode: (code: string) => void;
  totalActiveCount: number;
  securityLockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenIntake,
  onQuickScanCode,
  totalActiveCount,
  securityLockCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [utcTime, setUtcTime] = useState<string>('');
  const [isScanningSimulation, setIsScanningSimulation] = useState<boolean>(false);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setUtcTime(
        now.toUTCString().slice(17, 25) + ' UTC'
      );
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateScan = () => {
    setIsScanningSimulation(true);
    sfx.playScannerBeep();
    setTimeout(() => {
      setIsScanningSimulation(false);
      onQuickScanCode('CUST-2024-8891-B');
    }, 400);
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#0F172A] text-white shadow-md">
      {/* Barra superior de clasificación institucional y sesión */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium tracking-wider text-slate-300">
            <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
            <span>SISTEMA INSTITUCIONAL DE CONTROL DE CUSTODIA Y EVIDENCIAS</span>
          </div>
          <span className="hidden text-slate-600 md:inline">|</span>
          <span className="hidden font-mono text-[11px] text-slate-400 md:inline">
            MOSTRADOR #04 · ESTACIÓN CENTRAL / TERMINAL B
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-500">HORA SIS:</span>
            <span className="font-semibold text-emerald-400">{currentTime || '00:00:00'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{utcTime || '00:00:00 UTC'}</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          
          {/* Identificación de Usuario y Botón de Cerrar Sesión */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-slate-200">
              {isAdmin ? (
                <Shield className="h-3.5 w-3.5 text-red-400" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span className="font-semibold">{currentUser.name}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                {isAdmin ? 'ADMINISTRADOR' : 'EMPLEADO'}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión Actual"
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-red-950 hover:text-red-200 hover:border-red-800 border border-slate-700 transition"
            >
              <LogOut className="h-3 w-3" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra Operativa Principal */}
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        {/* Identidad de marca */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A8A] text-white shadow-inner ring-1 ring-white/20">
              <Boxes className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                  CUSTODIA CORE
                </h1>
                <span className="rounded bg-sky-950/80 px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wide text-sky-300 border border-sky-800">
                  CADENA DE CUSTODIA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Libro de Registro y Terminal de Entrega Inmediata
              </p>
            </div>
          </div>

          {/* Indicadores numéricos rápidos */}
          <div className="hidden items-center gap-2 lg:flex ml-4 pl-4 border-l border-slate-700/60">
            <div className="flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 border border-slate-700">
              <span className="text-slate-400">En Custodia:</span>
              <span className="font-semibold text-emerald-400 font-mono">{totalActiveCount}</span>
            </div>
            {securityLockCount > 0 && (
              <div className="flex items-center gap-1.5 rounded bg-red-950/80 px-2.5 py-1 text-xs text-red-200 border border-red-800 animate-pulse">
                <Lock className="h-3 w-3 text-red-400" />
                <span className="text-red-300">Retenciones Judiciales:</span>
                <span className="font-semibold text-red-400 font-mono">{securityLockCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Buscador y Lector Óptico con Estroboscopio */}
        <div className="relative flex-1 max-w-xl">
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar código (ej. CUST-2024-8891-B), n.º de serie, marca, DNI..."
              className="h-10 w-full rounded-md border border-slate-700 bg-slate-900/90 pl-9 pr-28 text-sm text-white placeholder-slate-400 transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
            />
            
            {/* Línea estroboscópica del escáner */}
            <div
              className={`pointer-events-none absolute bottom-0 left-2 right-2 h-0.5 bg-[#0284C7] ${
                isScanningSimulation ? 'opacity-100 shadow-[0_0_8px_#0284C7]' : 'animate-scan-strobe'
              }`}
            />

            {/* Botón de Escaneo Rápido */}
            <div className="absolute right-1 flex items-center gap-1">
              <button
                type="button"
                onClick={handleSimulateScan}
                title="Simular Lector Láser / RFID"
                className="flex items-center gap-1 rounded bg-[#0284C7]/20 px-2 py-1 text-xs font-medium text-sky-300 border border-[#0284C7]/40 transition-colors hover:bg-[#0284C7]/30 hover:text-white"
              >
                <Barcode className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Botón de Entrada */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenIntake}
            className="flex items-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Registrar Recepción</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-[#131b2e] px-4 lg:px-6">
        <nav className="flex space-x-1 py-1.5" aria-label="Vistas Operativas">
          <button
            onClick={() => onTabChange('queue')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              currentTab === 'queue'
                ? 'bg-[#1E3A8A] text-white shadow-sm ring-1 ring-sky-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cola y Registro de Custodia</span>
          </button>

          <button
            onClick={() => onTabChange('lockers')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              currentTab === 'lockers'
                ? 'bg-[#1E3A8A] text-white shadow-sm ring-1 ring-sky-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Matriz de Bóveda y Casilleros</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              currentTab === 'audit'
                ? 'bg-[#1E3A8A] text-white shadow-sm ring-1 ring-sky-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Libro Oficial de Auditoría</span>
          </button>
        </nav>

        <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span>Red Solenoide de Casilleros: En línea</span>
        </div>
      </div>
    </header>
  );
};
