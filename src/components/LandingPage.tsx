import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { CustodyItem, SessionUser, CitizenLostReport } from '../types/custody';
import { StatusBadge } from './StatusBadge';
import { sfx } from '../utils/audio';

interface LandingPageProps {
  items: CustodyItem[];
  reports: CitizenLostReport[];
  currentUser: SessionUser | null;
  onGoToLogin: (tab?: 'login' | 'register') => void;
  onEnterApp: () => void;
  onLogout: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  items,
  currentUser,
  onGoToLogin,
  onEnterApp,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<CustodyItem | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const activeInCustody = useMemo(
    () => items.filter((i) => i.status === 'EN_CUSTODIA').length,
    [items]
  );
  const deliveredCount = useMemo(
    () => items.filter((i) => i.status === 'ENTREGADO').length,
    [items]
  );

  const filteredPublicItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q) ||
        item.distinctMarks.toLowerCase().includes(q) ||
        item.location.lockerNumber.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const isPubliclyVisible =
        item.status === 'EN_CUSTODIA' || item.status === 'ADVERTENCIA';

      return matchesSearch && matchesCat && isPubliclyVisible;
    });
  }, [items, searchQuery, selectedCategory]);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'electronics', label: 'Tecnología' },
    { id: 'wallets_ids', label: 'Billeteras & Docs' },
    { id: 'luggage', label: 'Equipaje' },
    { id: 'keys', label: 'Llaves' },
    { id: 'jewelry', label: 'Relojería & Joyas' },
  ];

  const handleActionClick = (defaultTab: 'login' | 'register' = 'login') => {
    sfx.playClick();
    if (currentUser) {
      onEnterApp();
    } else {
      onGoToLogin(defaultTab);
    }
  };

  const scrollRail = (dir: 'left' | 'right') => {
    if (!railRef.current) return;
    const amount = dir === 'left' ? -460 : 460;
    railRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#ebebeb] text-black flex flex-col">
      {/* 1. COBALT ANNOUNCEMENT BAR — Sole chromatic element (#0700ff) */}
      <div className="w-full h-8 bg-[#0700ff] text-white flex items-center justify-center px-4">
        <p className="text-[13px] font-normal tracking-[-0.14px] text-center truncate">
          SENA Regional Huila · CIES Neiva · Galería de Custodia y Validación de Objetos Perdidos (Ficha ADSO 3413988)
        </p>
      </div>

      {/* 2. PRIMARY NAVIGATION BAR — Flat white gallery chrome */}
      <header className="w-full bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <a
            href="#top"
            className="text-[16px] font-medium tracking-[-0.02em] text-black flex items-center gap-2"
          >
            <span>Custodia.Space</span>
            <span className="text-[11px] font-normal text-[#b5b5b5] uppercase tracking-[0.18em]">
              SENA
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-6 text-[14px] font-normal">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'text-black font-medium underline underline-offset-4'
                    : 'text-[#b5b5b5] hover:text-black'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Flush Search + Account Links */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-[#b5b5b5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar objeto..."
              className="rounded-[16px] bg-[#f7f7f7] pl-9 pr-4 py-1.5 text-[14px] font-normal text-black placeholder-[#b5b5b5] focus:outline-none focus:bg-[#ebebeb] transition w-44 sm:w-56"
            />
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleActionClick('login')}
                className="rounded-full bg-black text-white px-4 py-2 text-[14px] font-medium hover:bg-neutral-800 transition cursor-pointer"
              >
                Panel ({currentUser.name.split(' ')[0]})
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onLogout();
                }}
                className="rounded-full border border-[#ebebeb] bg-transparent text-black px-4 py-2 text-[14px] font-normal hover:border-black transition cursor-pointer"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleActionClick('login')}
                className="text-[14px] font-normal text-black hover:opacity-60 transition cursor-pointer"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => handleActionClick('register')}
                className="rounded-full bg-black text-white px-4 py-2 text-[14px] font-medium hover:bg-neutral-800 transition cursor-pointer"
              >
                Crea tu cuenta
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 3. PANEL PRINCIPAL DE BIENVENIDA (LO PRIMERO QUE SE VE AL ENTRAR) */}
      <section className="w-full bg-white border-t border-b border-[#ebebeb]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Columna Izquierda: Explicación Clara e Inmediata del Propósito de la Página */}
          <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#ebebeb]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f7f7f7] border border-[#ebebeb] px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-black mb-6">
                <span className="h-2 w-2 rounded-full bg-[#0700ff]" />
                <span>CENTRO OFICIAL DE OBJETOS PERDIDOS</span>
              </div>

              <h1 className="text-[34px] sm:text-[40px] font-medium leading-[1.1] tracking-[-0.88px] text-black mb-4">
                Entrega y Recepción de Objetos Perdidos
              </h1>

              <p className="text-[16px] text-[#555555] leading-[1.45] mb-6">
                Bienvenido a la plataforma institucional para <strong>recuperar tus pertenencias extraviadas</strong> o <strong>reportar objetos encontrados</strong> en el campus SENA CIES Neiva. Todo artículo se resguarda en casilleros numerados y se entrega con verificación de propiedad y firma de acta.
              </p>

              {/* Resumen visual de qué puedes hacer aquí */}
              <div className="space-y-2.5 border-t border-[#ebebeb] pt-5 text-[13px]">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold bg-black text-white rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-black">
                    <strong>¿Perdiste algo?</strong> Búscalo en el catálogo de abajo o radica tu reporte de pérdida.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold bg-black text-white rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-black">
                    <strong>¿Encontraste un objeto?</strong> Entrégalo en recepción o repórtalo para ubicar a su dueño.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold bg-black text-white rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-black">
                    <strong>Entrega segura:</strong> Validación del 70% de coincidencia y firma de entrega en ventanilla.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-[#ebebeb] flex flex-wrap items-center justify-between gap-4">
              <a
                href="#archivo-custodia"
                className="rounded-full bg-black text-white px-6 py-2.5 text-[14px] font-medium hover:bg-neutral-800 transition inline-flex items-center gap-2"
              >
                <span>Ver Objetos en Custodia ({activeInCustody})</span>
                <span>↓</span>
              </a>

              <div className="text-[12px] font-mono text-[#b5b5b5]">
                HORARIO: L-V 7:00 - 18:00
              </div>
            </div>
          </div>

          {/* Columna Derecha: Fotografía Principal de Recepción y Entrega de Objetos Perdidos */}
          <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[440px] lg:min-h-[520px] bg-[#f7f7f7] overflow-hidden">
            <img
              src="/hero-objetos-perdidos.jpg"
              alt="Recepción y Entrega de Objetos Perdidos - Recupere sus pertenencias"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-xs p-3.5 rounded-[2px] border border-[#ebebeb]">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#b5b5b5] block">
                  VENTANILLA DE RECEPCIÓN Y ENTREGA · SENA CIES
                </span>
                <span className="text-[13px] font-medium text-black">
                  Atención presencial, casilleros numerados y acta de firma de entrega
                </span>
              </div>
              <span className="rounded-full bg-black text-white px-3 py-1 text-[11px] font-mono">
                {activeInCustody} Objetos en Bóveda
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HORIZONTAL PRODUCT RAIL ("En Custodia Activa") — Basic.Space Curated Rail */}
      <section id="archivo-custodia" className="bg-white py-12 px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-medium tracking-[-0.2px] text-black">
              Archivo en Custodia ({filteredPublicItems.length})
            </h2>
            <ArrowUpRight className="h-4 w-4 text-black" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRail('left')}
              className="h-8 w-8 rounded-full border border-[#ebebeb] flex items-center justify-center text-black hover:border-black transition cursor-pointer"
              aria-label="Anterior"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollRail('right')}
              className="h-8 w-8 rounded-full border border-[#ebebeb] flex items-center justify-center text-black hover:border-black transition cursor-pointer"
              aria-label="Siguiente"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Category Pills */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto no-scrollbar mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-black text-white font-medium'
                  : 'bg-white text-black border border-[#ebebeb]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Horizontal Product Cards Rail — 4px gap, 2px sharp image corners, zero card chrome */}
        {filteredPublicItems.length === 0 ? (
          <div className="py-16 text-center bg-[#f7f7f7] rounded-[2px]">
            <p className="text-[16px] font-medium text-black">
              No se encontraron objetos en esta categoría.
            </p>
            <p className="text-[14px] text-[#b5b5b5] mt-1">
              Si extraviaste una pertenencia, inicia sesión para radicar un reporte oficial.
            </p>
            <button
              type="button"
              onClick={() => handleActionClick('login')}
              className="mt-5 rounded-full bg-black text-white px-5 py-2 text-[14px] font-medium hover:bg-neutral-800 transition cursor-pointer"
            >
              Radicar Reporte
            </button>
          </div>
        ) : (
          <div
            ref={railRef}
            className="flex items-start gap-[4px] overflow-x-auto no-scrollbar pb-2"
          >
            {filteredPublicItems.map((item) => {
              const mainPhotoUrl =
                item.evidencePhotos?.[0]?.url ||
                'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80';

              return (
                <div
                  key={item.id}
                  onClick={() => setPreviewItem(item)}
                  className="group w-[220px] sm:w-[250px] shrink-0 cursor-pointer bg-white"
                >
                  {/* 4:5 Studio Image Container, 2px radius, zero shadow */}
                  <div className="relative aspect-[4/5] w-full bg-[#f7f7f7] rounded-[2px] overflow-hidden">
                    <img
                      src={mainPhotoUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="rounded-full bg-white/95 text-black px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]">
                        {item.location.lockerNumber}
                      </span>
                    </div>
                  </div>

                  {/* 12px gap below image, zero padding */}
                  <div className="mt-3 pr-2">
                    <h3 className="text-[16px] font-medium leading-[1.3] tracking-[-0.16px] text-black line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[14px] font-normal text-[#b5b5b5]">
                      {item.trackingCode} · {item.color}
                    </p>
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.25em] text-black">
                      {item.brand}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. SEAMLESS 3-COLUMN COLLECTION GRID — Zero gap */}
      <section className="grid grid-cols-1 md:grid-cols-3 w-full bg-black">
        <div className="relative h-[340px] overflow-hidden group border-b md:border-b-0 md:border-r border-white/15">
          <img
            src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80"
            alt="Dispositivos"
            className="w-full h-full object-cover opacity-60 grayscale group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/80 mb-2">
              01 · RECEPCIÓN Y CASILLEROS
            </span>
            <h3 className="text-[32px] font-medium leading-[1.13] tracking-[-0.836px] text-white">
              {activeInCustody} En Custodia
            </h3>
          </div>
        </div>

        <div className="relative h-[340px] overflow-hidden group border-b md:border-b-0 md:border-r border-white/15">
          <img
            src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80"
            alt="Validación"
            className="w-full h-full object-cover opacity-60 grayscale group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/80 mb-2">
              02 · PROTOCOLO DE PROPIEDAD
            </span>
            <h3 className="text-[32px] font-medium leading-[1.13] tracking-[-0.836px] text-white">
              Validación 70%
            </h3>
          </div>
        </div>

        <div className="relative h-[340px] overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"
            alt="Restituidos"
            className="w-full h-full object-cover opacity-60 grayscale group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/80 mb-2">
              03 · ACTAS DIGITALES FIRMADAS
            </span>
            <h3 className="text-[32px] font-medium leading-[1.13] tracking-[-0.836px] text-white">
              {deliveredCount} Restituidos
            </h3>
          </div>
        </div>
      </section>

      {/* 6. PROTOCOLO DE ENTREGA EN GALERÍA (4 PASOS MINIMALISTAS) */}
      <section className="bg-white py-16 px-6 border-t border-[#ebebeb]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12 pb-4 border-b border-[#ebebeb]">
            <div>
              <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5] block mb-1">
                PROCEDIMIENTO OFICIAL
              </span>
              <h2 className="text-[32px] sm:text-[38px] font-medium leading-[1.13] tracking-[-0.836px] text-black">
                Protocolo de Restitución
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#ebebeb] border border-[#ebebeb]">
            <div className="bg-white p-6">
              <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5]">
                01 / REGISTRO
              </span>
              <h3 className="text-[18px] font-medium text-black mt-3 mb-2">
                Cuenta de Cliente
              </h3>
              <p className="text-[14px] text-[#b5b5b5] leading-[1.43]">
                Crea tu perfil con rol inicial de Cliente para consultar el archivo o radicar reportes de extravío y hallazgo.
              </p>
            </div>

            <div className="bg-white p-6">
              <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5]">
                02 / CUSTODIA
              </span>
              <h3 className="text-[18px] font-medium text-black mt-3 mb-2">
                Bóveda y Casilleros
              </h3>
              <p className="text-[14px] text-[#b5b5b5] leading-[1.43]">
                Cada artículo es fotografiado (≤ 500 KB), etiquetado con precinto y resguardado en casilleros controlados.
              </p>
            </div>

            <div className="bg-white p-6">
              <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5]">
                03 / VERIFICACIÓN
              </span>
              <h3 className="text-[18px] font-medium text-black mt-3 mb-2">
                Cuestionario 70%
              </h3>
              <p className="text-[14px] text-[#b5b5b5] leading-[1.43]">
                Demuestra la titularidad respondiendo detalles privados. Si un cliente falla 4 veces en un bien, se bloquea solo para ese cliente.
              </p>
            </div>

            <div className="bg-white p-6">
              <span className="text-[12px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5]">
                04 / ENTREGA
              </span>
              <h3 className="text-[18px] font-medium text-black mt-3 mb-2">
                Acta SHA-256
              </h3>
              <p className="text-[14px] text-[#b5b5b5] leading-[1.43]">
                Formalización con firma digital y registro inmutable en el libro mayor de auditoría institucional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MODAL DE VISTA PREVIA DEL OBJETO — Sharp 2px gallery frame, pill buttons */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[2px] max-w-lg w-full overflow-hidden border border-[#ebebeb]">
            <div className="relative aspect-[4/3] bg-[#f7f7f7]">
              <img
                src={
                  previewItem.evidencePhotos?.[0]?.url ||
                  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80'
                }
                alt={previewItem.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 rounded-full bg-white text-black h-8 w-8 flex items-center justify-center text-xs border border-[#ebebeb] hover:border-black cursor-pointer"
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-3">
                <StatusBadge status={previewItem.status} />
              </div>
            </div>

            <div className="p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#b5b5b5] mb-1">
                {previewItem.brand} · {previewItem.trackingCode}
              </p>
              <h3 className="text-[20px] font-medium text-black tracking-[-0.2px] mb-2">
                {previewItem.title}
              </h3>
              <p className="text-[14px] text-[#b5b5b5] leading-[1.43] mb-5">
                {previewItem.distinctMarks}
              </p>

              <div className="grid grid-cols-2 gap-[1px] bg-[#ebebeb] border border-[#ebebeb] text-[13px] mb-6">
                <div className="bg-[#f7f7f7] p-3">
                  <span className="text-[#b5b5b5] block text-[11px] uppercase tracking-[0.12em]">
                    Color
                  </span>
                  <span className="font-medium text-black">{previewItem.color}</span>
                </div>
                <div className="bg-[#f7f7f7] p-3">
                  <span className="text-[#b5b5b5] block text-[11px] uppercase tracking-[0.12em]">
                    Casillero
                  </span>
                  <span className="font-medium text-black">
                    {previewItem.location.lockerNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewItem(null);
                    handleActionClick('login');
                  }}
                  className="flex-1 py-2.5 px-5 bg-black hover:bg-neutral-800 text-white text-[14px] font-medium rounded-full transition cursor-pointer"
                >
                  {currentUser ? 'Ir al Portal para Reclamar' : 'Iniciar Sesión para Reclamar'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="py-2.5 px-5 bg-white border border-[#ebebeb] hover:border-black text-black text-[14px] font-normal rounded-full transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. FOOTER — Clean Achromatic Gallery Footer */}
      <footer className="bg-white text-black border-t border-[#ebebeb] py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-[13px] text-[#b5b5b5]">
          <div className="flex items-center gap-3">
            <span className="font-medium text-black">Custodia.Space · SENA CIES Neiva</span>
            <span>—</span>
            <span>ADSO Ficha 3413988</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Neiva, Huila · Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
