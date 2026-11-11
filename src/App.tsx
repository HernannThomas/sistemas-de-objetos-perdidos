import React, { useState, useMemo } from 'react';
import {
  Filter,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustodyItem, TimelineStep, ClaimantRecord, SessionUser } from './types/custody';
import { INITIAL_CUSTODY_ITEMS } from './data/mockItems';
import { LoginScreen } from './components/LoginScreen';
import { CitizenPortal } from './components/CitizenPortal';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { ItemDetailView } from './components/ItemDetailView';
import { SignatureHandoffModal } from './components/SignatureHandoffModal';
import { AssetTagModal } from './components/AssetTagModal';
import { SecurityHoldModal } from './components/SecurityHoldModal';
import { RapidIntakeModal } from './components/RapidIntakeModal';
import { WarehouseMatrix } from './components/WarehouseMatrix';
import { AuditLedger } from './components/AuditLedger';
import { sfx } from './utils/audio';

export default function App() {
  // Estado de Autenticación de Usuario (nulo antes de iniciar sesión)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const [items, setItems] = useState<CustodyItem[]>(INITIAL_CUSTODY_ITEMS);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    INITIAL_CUSTODY_ITEMS[0]?.id || ''
  );
  const [currentTab, setCurrentTab] = useState<'queue' | 'lockers' | 'audit'>('queue');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modales
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [isAssetTagModalOpen, setIsAssetTagModalOpen] = useState(false);
  const [isSecurityHoldModalOpen, setIsSecurityHoldModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  // Bien seleccionado
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  // Contadores
  const totalActiveCount = useMemo(() => {
    return items.filter((i) => i.status === 'EN_CUSTODIA').length;
  }, [items]);

  const securityLockCount = useMemo(() => {
    return items.filter((i) => i.status === 'BLOQUEADO_POR_SEGURIDAD').length;
  }, [items]);

  // Elementos filtrados
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.trackingCode.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
        item.finder.name.toLowerCase().includes(q) ||
        (item.claimant && item.claimant.fullName.toLowerCase().includes(q)) ||
        item.location.lockerNumber.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ? true : item.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'all' ? true : item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchQuery, statusFilter, categoryFilter]);

  // Salto rápido por escaneo
  const handleQuickScanCode = (code: string) => {
    const found = items.find(
      (i) => i.trackingCode.toLowerCase() === code.toLowerCase()
    );
    if (found) {
      setSelectedItemId(found.id);
      setCurrentTab('queue');
    } else {
      setSearchQuery(code);
    }
  };

  // Apertura y cierre de cerradura solenoide
  const handleToggleDrawerLock = (targetId?: string) => {
    const idToToggle = targetId || selectedItemId;
    sfx.playSolenoidLatch();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === idToToggle) {
          const nextLock = !item.location.isLocked;
          return {
            ...item,
            location: {
              ...item.location,
              isLocked: nextLock,
            },
          };
        }
        return item;
      })
    );
  };

  // Añadir paso de auditoría en la línea temporal
  const handleAddTimelineStep = (stepData: Omit<TimelineStep, 'id'>) => {
    if (!selectedItem) return;
    const newStep: TimelineStep = {
      ...stepData,
      id: 'step-' + Date.now(),
      officer: currentUser?.name || stepData.officer,
      officerBadge: currentUser?.badgeNumber || stepData.officerBadge,
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            timeline: [...item.timeline, newStep],
          };
        }
        return item;
      })
    );
  };

  // Completar entrega formal con firma digital
  const handleCompleteHandoff = (record: ClaimantRecord) => {
    if (!selectedItem) return;

    const handoffStep: TimelineStep = {
      id: 'step-handoff-' + Date.now(),
      title: 'Entrega Formal y Firma Digital Registrada',
      timestamp: record.verifiedTimestamp,
      officer: currentUser?.name || 'Ofc. J. Martínez',
      officerBadge: currentUser?.badgeNumber || '8921-SEC',
      status: 'completed',
      notes: `El titular ${record.fullName} (${record.idType} ${record.idNumber}) rubricó el descargo de entrega. Casillero liberado.`,
      hash: 'SHA256: ' + Math.random().toString(36).substring(2, 8) + '...entrega',
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            status: 'ENTREGADO',
            claimant: record,
            location: {
              ...item.location,
              isLocked: false,
            },
            timeline: [...item.timeline, handoffStep],
          };
        }
        return item;
      })
    );

    setIsHandoffModalOpen(false);
  };

  // Decretar retención policial
  const handleConfirmSecurityHold = (reason: string, incidentRef: string) => {
    if (!selectedItem) return;

    const holdStep: TimelineStep = {
      id: 'step-hold-' + Date.now(),
      title: 'Retención Policial Dictada: ' + incidentRef,
      timestamp:
        new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        ' · ' +
        new Date().toLocaleTimeString('es-ES', { hour12: false }),
      officer: currentUser?.name || 'Mando de Guardia',
      officerBadge: currentUser?.badgeNumber || '0104-CMD',
      status: 'security_hold',
      notes: reason,
      hash: 'SHA256: ' + Math.random().toString(36).substring(2, 8) + '...retencion',
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            status: 'BLOQUEADO_POR_SEGURIDAD',
            securityHoldReason: reason,
            location: {
              ...item.location,
              isLocked: true,
            },
            timeline: [...item.timeline, holdStep],
          };
        }
        return item;
      })
    );
  };

  // Levantar retención cautelar
  const handleRemoveSecurityHold = () => {
    if (!selectedItem) return;

    const liftStep: TimelineStep = {
      id: 'step-lift-' + Date.now(),
      title: 'Medida Cautelar Levantada por Mando Superior',
      timestamp:
        new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        ' · ' +
        new Date().toLocaleTimeString('es-ES', { hour12: false }),
      officer: currentUser?.name || 'Cap. R. Hernández',
      officerBadge: currentUser?.badgeNumber || '0104-CMD',
      status: 'completed',
      notes: 'Verificación policial concluida sin cargos. Retención alzada y bien restituido al régimen ordinario de custodia.',
      hash: 'SHA256: ' + Math.random().toString(36).substring(2, 8) + '...restituido',
    };

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            status: 'EN_CUSTODIA',
            securityHoldReason: undefined,
            timeline: [...item.timeline, liftStep],
          };
        }
        return item;
      })
    );
  };

  // Alta de nuevo bien
  const handleSaveNewIntake = (newItem: CustodyItem) => {
    const updatedIntakeItem: CustodyItem = {
      ...newItem,
      intakeOfficer: {
        name: currentUser?.name || 'Ofc. J. Martínez',
        badge: currentUser?.badgeNumber || '8921-SEC',
      },
    };
    setItems((prev) => [updatedIntakeItem, ...prev]);
    setSelectedItemId(updatedIntakeItem.id);
    setCurrentTab('queue');
  };

  const nextTrackingCode = useMemo(() => {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `CUST-2026-${randomHex}-${suffix}`;
  }, [items.length]);

  // Si no ha iniciado sesión, mostrar el panel de login institucional
  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  // Si el usuario es 'user' (ciudadano / reclamante), mostrar portal público de consulta
  if (currentUser.role === 'user') {
    return (
      <CitizenPortal
        currentUser={currentUser}
        items={items}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // Para 'admin' y 'employee', mostrar la consola institucional completa
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0b1c30] flex flex-col font-sans">
      {/* Barra Operativa y Navegación Principal con Datos de Sesión */}
      <Header
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenIntake={() => setIsIntakeModalOpen(true)}
        onQuickScanCode={handleQuickScanCode}
        totalActiveCount={totalActiveCount}
        securityLockCount={securityLockCount}
      />

      {/* Contenedor Cuadrícula de 12 Columnas */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {currentTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Panel Izquierdo: 4 Columnas (Cola de Recepción y Filtros) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Tarjeta de Filtros */}
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-800">
                      Cola de Custodia ({filteredItems.length})
                    </span>
                  </div>
                  {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setStatusFilter('all');
                        setCategoryFilter('all');
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restablecer</span>
                    </motion.button>
                  )}
                </div>

                {/* Filtros Segmentados por Estado */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'EN_CUSTODIA', label: 'En Custodia' },
                    { id: 'BLOQUEADO_POR_SEGURIDAD', label: 'Retenciones' },
                    { id: 'ADVERTENCIA', label: 'Alertas' },
                    { id: 'ENTREGADO', label: 'Entregados' },
                  ].map((tab) => (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                        statusFilter === tab.id
                          ? 'bg-[#0F172A] text-white shadow-xs font-semibold'
                          : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Filtros por Categoría */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { id: 'all', label: 'Todas las Categorías' },
                    { id: 'electronics', label: 'Electrónica' },
                    { id: 'wallets_ids', label: 'Carteras / DNI' },
                    { id: 'jewelry', label: 'Joyería' },
                    { id: 'keys', label: 'Llaves' },
                    { id: 'luggage', label: 'Equipajes' },
                    { id: 'documents', label: 'Documentos' },
                  ].map((cat) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-2 py-0.5 rounded transition ${
                        categoryFilter === cat.id
                          ? 'bg-[#2563EB] text-white font-medium shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Lista de Fichas en Cola con AnimatePresence */}
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {filteredItems.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500"
                    >
                      <p className="text-sm font-medium">No se encontraron bienes con estos criterios.</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Modifique los filtros o los términos de búsqueda en la barra superior.
                      </p>
                    </motion.div>
                  ) : (
                    filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={() => setSelectedItemId(item.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Panel Derecho: 8 Columnas (Inspección Detallada y Línea de Custodia) */}
            <div className="lg:col-span-8">
              {selectedItem ? (
                <ItemDetailView
                  item={selectedItem}
                  currentUserRole={currentUser.role}
                  onOpenHandoffModal={() => setIsHandoffModalOpen(true)}
                  onOpenAssetTagModal={() => setIsAssetTagModalOpen(true)}
                  onOpenSecurityHoldModal={() => setIsSecurityHoldModalOpen(true)}
                  onToggleDrawerLock={() => handleToggleDrawerLock(selectedItem.id)}
                  onAddTimelineStep={handleAddTimelineStep}
                  onRemoveSecurityHold={handleRemoveSecurityHold}
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400">
                  Seleccione un bien de la cola para inspeccionar su cadena de custodia.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña: Matriz de Bóvedas y Casilleros Físicos */}
        {currentTab === 'lockers' && (
          <WarehouseMatrix
            items={items}
            onSelectItem={(item) => {
              setSelectedItemId(item.id);
              setCurrentTab('queue');
            }}
            onToggleLock={(itemId) => handleToggleDrawerLock(itemId)}
          />
        )}

        {/* Pestaña: Libro Oficial de Auditoría y Diligencias */}
        {currentTab === 'audit' && (
          <AuditLedger
            items={items}
            onSelectItem={(item) => {
              setSelectedItemId(item.id);
              setCurrentTab('queue');
            }}
          />
        )}
      </main>

      {/* Modales y Diligencias con AnimatePresence */}
      <AnimatePresence>
        {selectedItem && isHandoffModalOpen && (
          <SignatureHandoffModal
            item={selectedItem}
            isOpen={isHandoffModalOpen}
            onClose={() => setIsHandoffModalOpen(false)}
            onCompleteHandoff={handleCompleteHandoff}
          />
        )}

        {selectedItem && isAssetTagModalOpen && (
          <AssetTagModal
            item={selectedItem}
            isOpen={isAssetTagModalOpen}
            onClose={() => setIsAssetTagModalOpen(false)}
          />
        )}

        {selectedItem && isSecurityHoldModalOpen && (
          <SecurityHoldModal
            item={selectedItem}
            isOpen={isSecurityHoldModalOpen}
            onClose={() => setIsSecurityHoldModalOpen(false)}
            onConfirmHold={handleConfirmSecurityHold}
          />
        )}

        {isIntakeModalOpen && (
          <RapidIntakeModal
            isOpen={isIntakeModalOpen}
            onClose={() => setIsIntakeModalOpen(false)}
            onSaveItem={handleSaveNewIntake}
            nextItemCode={nextTrackingCode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
