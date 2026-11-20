import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  CustodyItem,
  TimelineStep,
  ClaimantRecord,
  SessionUser,
  FailedAttempt,
  CitizenLostReport,
  AppNotification,
  DirectMessage,
} from './types/custody';
import { INITIAL_CUSTODY_ITEMS } from './data/mockItems';
import {
  INITIAL_USERS,
  INITIAL_CITIZEN_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MESSAGES,
} from './data/initialUsersAndReports';
import {
  loadProjectDatabase,
  saveProjectDatabase,
} from './services/database';
import { restApi } from './services/apiClient';
import { LandingPage } from './components/LandingPage';
import { LoginScreen } from './components/LoginScreen';
import { CitizenPortal } from './components/CitizenPortal';
import { CitizenReportsManager } from './components/CitizenReportsManager';
import { UsersRoleManager } from './components/UsersRoleManager';
import { DatabaseManagerView } from './components/DatabaseManagerView';
import { DirectChatDrawer } from './components/DirectChatDrawer';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { ItemDetailView } from './components/ItemDetailView';
import { ValidationProtocolModal } from './components/ValidationProtocolModal';
import { SignatureHandoffModal } from './components/SignatureHandoffModal';
import { AssetTagModal } from './components/AssetTagModal';
import { SecurityHoldModal } from './components/SecurityHoldModal';
import { RapidIntakeModal } from './components/RapidIntakeModal';
import { WarehouseMatrix } from './components/WarehouseMatrix';
import { AuditLedger } from './components/AuditLedger';
import { sfx } from './utils/audio';

const STORAGE_USERS_KEY = 'sop_sena_users_v4';
const STORAGE_ITEMS_KEY = 'sop_sena_items_v4';
const STORAGE_REPORTS_KEY = 'sop_sena_reports_v4';
const STORAGE_NOTIFS_KEY = 'sop_sena_notifications_v1';
const STORAGE_MESSAGES_KEY = 'sop_sena_messages_v1';

export default function App() {
  // Modo de navegación: 'landing' (Apartado de Inicio inicial), 'login' (Acceso/Registro), 'app' (Aplicativo)
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'app'>('landing');
  const [loginInitialTab, setLoginInitialTab] = useState<'login' | 'register'>('login');

  // Usuarios registrados del sistema con persistencia en localStorage
  const [users, setUsers] = useState<SessionUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback a iniciales
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch {
      // Ignore storage quota errors
    }
  }, [users]);

  // Estado de usuario con sesión activa
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  // Estado del inventario con persistencia en localStorage
  const [items, setItems] = useState<CustodyItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_CUSTODY_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  // Reportes ciudadanos con persistencia
  const [citizenReports, setCitizenReports] = useState<CitizenLostReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_REPORTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_CITIZEN_REPORTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(citizenReports));
    } catch {
      // Ignore
    }
  }, [citizenReports]);

  const [selectedItemId, setSelectedItemId] = useState<string>(
    INITIAL_CUSTODY_ITEMS[0]?.id || ''
  );
  const [currentTab, setCurrentTab] = useState<
    'queue' | 'lockers' | 'audit' | 'citizen_reports' | 'users' | 'database'
  >('queue');
  const [isDbConnectedToFile, setIsDbConnectedToFile] = useState<boolean>(true);
  const [lastDbSyncTime, setLastDbSyncTime] = useState<string>(new Date().toISOString());
  const isDbLoadedRef = useRef<boolean>(false);
  const skipNextSaveRef = useRef<boolean>(false);

  // Cargar datos iniciales desde MySQL XAMPP / database/db.json una sola vez al iniciar
  useEffect(() => {
    let mounted = true;
    loadProjectDatabase().then((db) => {
      if (!mounted) return;
      if (db.connectedToFile) {
        skipNextSaveRef.current = true;
        setUsers(db.users);
        setItems(db.items);
        setCitizenReports(db.citizenReports);
        setIsDbConnectedToFile(true);
        setLastDbSyncTime(db.lastUpdated);
      }
      isDbLoadedRef.current = true;
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sincronizar automáticamente con MySQL XAMPP y /database/db.json SOLO cuando el usuario hace un cambio real
  useEffect(() => {
    if (!isDbLoadedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveProjectDatabase(users, items, citizenReports).then((ok) => {
        if (ok) {
          setIsDbConnectedToFile(true);
          setLastDbSyncTime(new Date().toISOString());
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [users, items, citizenReports]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modales
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [isAssetTagModalOpen, setIsAssetTagModalOpen] = useState(false);
  const [isSecurityHoldModalOpen, setIsSecurityHoldModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  // Centro de Notificaciones y Chat Directo en Tiempo Real
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_MESSAGES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>('SOP-2026-0142-A');
  const [activeChatThreadTitle, setActiveChatThreadTitle] = useState<string>(
    'SOP-2026-0142-A · Apple iPhone 15 Pro Max 256GB Azul Titanio'
  );

  const pushNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'readByUserIds'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      readByUserIds: [],
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleOpenChat = (threadId?: string, threadTitle?: string) => {
    if (threadId) {
      setActiveChatThreadId(threadId);
    }
    if (threadTitle) {
      setActiveChatThreadTitle(threadTitle);
    }
    setIsChatDrawerOpen(true);
  };

  const handleSendChatMessage = (threadId: string, threadTitle: string, text: string) => {
    if (!currentUser) return;
    const newMsg: DirectMessage = {
      id: 'msg-' + Date.now(),
      threadId,
      threadTitle,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderEmail: currentUser.email,
      text,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);

    // Emitir notificación instantánea a la contraparte
    pushNotification({
      title: `Nuevo Mensaje en ${threadId}`,
      message: `${currentUser.name}: "${text.substring(0, 80)}"`,
      type: 'MESSAGE',
      targetRole: currentUser.role === 'user' ? 'staff' : 'client',
      relatedThreadId: threadId,
    });
  };

  const handleMarkNotificationRead = (notifId: string) => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId && !n.readByUserIds.includes(currentUser.id)
          ? { ...n, readByUserIds: [...n.readByUserIds, currentUser.id] }
          : n
      )
    );
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) =>
        !n.readByUserIds.includes(currentUser.id)
          ? { ...n, readByUserIds: [...n.readByUserIds, currentUser.id] }
          : n
      )
    );
  };

  // Datos pre-validados para pasar a la firma formal
  const [validatedClaimant, setValidatedClaimant] = useState<{
    fullName: string;
    idType: string;
    idNumber: string;
    phone: string;
    coincidencePercentage: number;
    notes: string;
  } | null>(null);

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
        (item.model && item.model.toLowerCase().includes(q)) ||
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

  // --- MANEJADORES DE NEGOCIO Y OPERACIONES CRUD ---

  // CRUD CREATE: Guardar nuevo bien hallado (RF-03 / RF-04)
  const handleSaveNewItem = (newItem: CustodyItem) => {
    setItems((prev) => [newItem, ...prev]);
    setSelectedItemId(newItem.id);
    setIsIntakeModalOpen(false);
    pushNotification({
      title: `Nuevo Objeto Creado (${newItem.trackingCode})`,
      message: `Se registró "${newItem.title}" en el casillero ${newItem.location.lockerNumber}.`,
      type: 'INTAKE',
      targetRole: 'all',
      relatedThreadId: newItem.trackingCode,
    });
  };

  // CRUD UPDATE: Actualizar datos de un objeto en custodia
  const handleUpdateItem = (updatedItem: CustodyItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    );
  };

  // CRUD DELETE: Eliminar un objeto en custodia
  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => {
      const remaining = prev.filter((i) => i.id !== itemId);
      if (selectedItemId === itemId) {
        setSelectedItemId(remaining[0]?.id || '');
      }
      return remaining;
    });
  };

  // CRUD UPDATE: Actualizar un reporte ciudadano
  const handleUpdateReport = (updatedReport: CitizenLostReport) => {
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
  };

  // CRUD DELETE: Eliminar un reporte ciudadano
  const handleDeleteReport = (reportId: string) => {
    setCitizenReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  // CRUD DELETE: Eliminar un usuario registrado
  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // RF-08: Continuar a la firma tras validación >= 70%
  const handleProceedToDelivery = (claimantData: {
    fullName: string;
    idType: string;
    idNumber: string;
    phone: string;
    coincidencePercentage: number;
    notes: string;
  }) => {
    setValidatedClaimant(claimantData);
    setIsValidationModalOpen(false);
    setIsHandoffModalOpen(true);
  };

  // RF-12 & RF-13: Formalizar entrega, acta con firma digital y Soft Delete
  const handleCompleteHandoff = (record: ClaimantRecord, targetItemId?: string) => {
    const targetItem = targetItemId
      ? items.find((i) => i.id === targetItemId)
      : selectedItem;
    if (!targetItem || !currentUser) return;

    const updatedTimeline: TimelineStep[] = [
      ...targetItem.timeline,
      {
        id: 'tl-' + Date.now(),
        title: 'Formalización de Entrega y Exoneración (RF-12 / RF-13)',
        timestamp: new Date().toLocaleString('es-CO'),
        officer: currentUser.name,
        officerBadge: currentUser.badgeNumber || 'ADSO-REC',
        status: 'completed',
        notes: `Acta firmada digitalmente por ${record.fullName} (${record.idType}: ${record.idNumber}) tras alcanzar ${record.coincidencePercentage}% de coincidencia. Bien dado de baja lógica del catálogo activo.`,
        hash: 'SHA256-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      },
    ];

    const updatedItems = items.map((item) => {
      if (item.id === targetItem.id) {
        return {
          ...item,
          status: 'ENTREGADO' as const,
          claimant: record,
          timeline: updatedTimeline,
        };
      }
      return item;
    });

    setItems(updatedItems);
    setIsHandoffModalOpen(false);
    setValidatedClaimant(null);
  };

  // RF-10 & RF-11: Registro de Intento Fallido del Cliente y Bloqueo al 4to Intento (Exclusivo para el Cliente)
  const handleRegisterFailedAttempt = (
    attempt: Omit<FailedAttempt, 'id' | 'timestamp'>,
    targetItemId?: string
  ) => {
    const targetItem = targetItemId
      ? items.find((i) => i.id === targetItemId)
      : selectedItem;
    if (!targetItem || !currentUser) return;

    const newAttempt: FailedAttempt = {
      ...attempt,
      id: 'att-' + Date.now(),
      timestamp: new Date().toLocaleString('es-CO'),
    };

    const newAttemptsList = [...(targetItem.failedAttempts || []), newAttempt];
    // Contar únicamente los intentos fallidos de ESTE cliente específico en este producto
    const clientAttemptsCount = newAttemptsList.filter(
      (a) =>
        (a.userId && a.userId === currentUser.id) ||
        (a.userEmail &&
          a.userEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
    ).length;
    const reachedFourForThisClient = clientAttemptsCount >= 4;

    const updatedTimeline: TimelineStep[] = [
      ...targetItem.timeline,
      {
        id: 'tl-' + Date.now(),
        title: reachedFourForThisClient
          ? `CLIENTE BLOQUEADO EN ESTE PRODUCTO: ${attempt.claimantName} (4/4 Intentos - RF-11)`
          : `Intento Fallido del Cliente ${attempt.claimantName} (${clientAttemptsCount}/4) - RF-10`,
        timestamp: new Date().toLocaleString('es-CO'),
        officer: currentUser.name,
        officerBadge: currentUser.badgeNumber || 'CLIENTE',
        status: reachedFourForThisClient ? 'security_hold' : 'warning',
        notes: reachedFourForThisClient
          ? `BLOQUEO INDIVIDUAL AL CLIENTE: El cliente ${attempt.claimantName} (${currentUser.email}) alcanzó 4 intentos fallidos en este bien. Solo este cliente queda bloqueado en el producto; los demás clientes y los empleados no son afectados.`
          : `Intento #${clientAttemptsCount}/4 fallido por el cliente ${attempt.claimantName} (${attempt.percentageScore}% obtenido). Motivo: ${attempt.reason}`,
        hash: 'SHA256-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      },
    ];

    const updatedItems = items.map((item) => {
      if (item.id === targetItem.id) {
        return {
          ...item,
          status:
            item.status === 'ENTREGADO'
              ? item.status
              : reachedFourForThisClient
              ? ('ADVERTENCIA' as const)
              : item.status,
          securityHoldReason: reachedFourForThisClient
            ? `El cliente ${attempt.claimantName} (${currentUser.email}) alcanzó 4/4 intentos fallidos y quedó bloqueado en este producto.`
            : item.securityHoldReason,
          failedAttempts: newAttemptsList,
          timeline: updatedTimeline,
        };
      }
      return item;
    });

    setItems(updatedItems);
    setIsValidationModalOpen(false);

    if (reachedFourForThisClient) {
      sfx.playSecurityAlert();
    }
  };

  // RF-15: Desbloqueo administrativo por ROLE_ADMIN
  const handleRemoveSecurityHold = (justification: string) => {
    if (!selectedItem || !currentUser) return;

    const updatedTimeline: TimelineStep[] = [
      ...selectedItem.timeline,
      {
        id: 'tl-' + Date.now(),
        title: 'Desbloqueo Administrativo de Seguridad (RF-15 / CU-08)',
        timestamp: new Date().toLocaleString('es-CO'),
        officer: currentUser.name,
        officerBadge: currentUser.badgeNumber || 'ADSO-ADMIN',
        status: 'completed',
        notes: `Desbloqueo emitido por ${currentUser.name}: ${justification}`,
        hash: 'SHA256-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      },
    ];

    const updatedItems = items.map((item) => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          status: 'EN_CUSTODIA' as const,
          securityHoldReason: undefined,
          failedAttempts: [],
          unlockedByAdmin: {
            adminName: currentUser.name,
            timestamp: new Date().toLocaleString('es-CO'),
            justification,
          },
          timeline: updatedTimeline,
        };
      }
      return item;
    });

    setItems(updatedItems);
    setIsSecurityHoldModalOpen(false);
  };

  // Bloqueo manual cautelar
  const handleApplySecurityHold = (reason: string) => {
    if (!selectedItem || !currentUser) return;

    const updatedTimeline: TimelineStep[] = [
      ...selectedItem.timeline,
      {
        id: 'tl-' + Date.now(),
        title: 'Inmovilización Preventiva por Seguridad',
        timestamp: new Date().toLocaleString('es-CO'),
        officer: currentUser.name,
        officerBadge: currentUser.badgeNumber || 'ADSO-REC',
        status: 'security_hold',
        notes: `Medida cautelar activa: ${reason}`,
        hash: 'SHA256-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      },
    ];

    const updatedItems = items.map((item) => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          status: 'BLOQUEADO_POR_SEGURIDAD' as const,
          securityHoldReason: reason,
          timeline: updatedTimeline,
        };
      }
      return item;
    });

    setItems(updatedItems);
    setIsSecurityHoldModalOpen(false);
  };

  // 1. VISTA: APARTADO DE INICIO (LANDING PAGE ANTES DE ENTRAR AL APLICATIVO)
  if (viewMode === 'landing') {
    return (
      <LandingPage
        items={items}
        reports={citizenReports}
        currentUser={currentUser}
        onGoToLogin={(tab) => {
          setLoginInitialTab(tab || 'login');
          setViewMode('login');
        }}
        onEnterApp={() => {
          setViewMode('app');
        }}
        onLogout={() => {
          restApi.logout();
          setCurrentUser(null);
          setViewMode('landing');
        }}
      />
    );
  }

  // 2. VISTA: PANTALLA DE ACCESO Y "CREA TU CUENTA"
  if (viewMode === 'login' || !currentUser) {
    return (
      <LoginScreen
        users={users}
        initialTab={loginInitialTab}
        onLogin={(user) => {
          setCurrentUser(user);
          setCurrentTab('queue');
          setViewMode('app');
        }}
        onRegister={(newUser) => {
          // Guardar usuario registrado (con rol 'user' Cliente inicial obligatorio)
          setUsers((prev) => [newUser, ...prev]);
          setCurrentUser(newUser);
          setViewMode('app');
        }}
        onBackToLanding={() => {
          setViewMode('landing');
        }}
      />
    );
  }

  // 3. VISTA: PORTAL CIUDADANO (ROLE_CIUDADANO / CLIENTE)
  if (currentUser.role === 'user') {
    return (
      <>
        <CitizenPortal
          currentUser={currentUser}
          items={items}
          reports={citizenReports}
          notifications={notifications}
          totalMessagesCount={messages.length}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onOpenChat={handleOpenChat}
          onCreateReport={(newReport) => {
            setCitizenReports((prev) => [newReport, ...prev]);
            pushNotification({
              title: `Nuevo Reporte Radicado (${newReport.id})`,
              message: `${currentUser.name} radicó ${
                newReport.reportType === 'FOUND' ? 'hallazgo' : 'pérdida'
              } de "${newReport.title}".`,
              type: 'INTAKE',
              targetRole: 'staff',
              relatedThreadId: newReport.id,
            });
          }}
          onUpdateReport={handleUpdateReport}
          onDeleteReport={handleDeleteReport}
          onRegisterFailedAttempt={(itemId, attempt) => {
            handleRegisterFailedAttempt(attempt, itemId);
            const target = items.find((i) => i.id === itemId);
            pushNotification({
              title: `Intento Fallido de Reclamo · ${target?.trackingCode || itemId}`,
              message: `El cliente ${currentUser.name} falló la validación (${attempt.percentageScore}%).`,
              type: 'SECURITY',
              targetRole: 'staff',
              relatedThreadId: target?.trackingCode || itemId,
            });
          }}
          onCompleteClaim={(itemId, record) => {
            handleCompleteHandoff(record, itemId);
            const target = items.find((i) => i.id === itemId);
            pushNotification({
              title: `¡Reclamo Validado al ${record.coincidencePercentage}%! (${target?.trackingCode})`,
              message: `${currentUser.name} superó la validación de propiedad del artículo "${target?.title}".`,
              type: 'CLAIM',
              targetRole: 'staff',
              relatedThreadId: target?.trackingCode || itemId,
            });
          }}
          onLogout={() => {
            restApi.logout();
            setCurrentUser(null);
            setViewMode('landing');
          }}
          onGoToLanding={() => setViewMode('landing')}
        />

        <DirectChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          currentUser={currentUser}
          messages={messages}
          items={items}
          reports={citizenReports}
          activeThreadId={activeChatThreadId}
          activeThreadTitle={activeChatThreadTitle}
          onSelectThread={(threadId, title) => {
            setActiveChatThreadId(threadId);
            setActiveChatThreadTitle(title);
          }}
          onSendMessage={handleSendChatMessage}
        />
      </>
    );
  }

  // 4. VISTA: DASHBOARD INTERNO DE RECEPCIÓN Y CUSTODIA (EMPLEADO / ADMINISTRADOR)
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-black flex flex-col">
      {/* Header Institucional */}
      <Header
        currentUser={currentUser}
        activeTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
        onLogout={() => {
          restApi.logout();
          setCurrentUser(null);
          setViewMode('landing');
        }}
        onGoToLanding={() => setViewMode('landing')}
        inCustodyCount={totalActiveCount}
        lockedCount={securityLockCount}
        citizenReportsCount={citizenReports.length}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenChat={handleOpenChat}
        totalMessagesCount={messages.length}
      />

      {/* Contenido Principal */}
      <main className="mx-auto max-w-7xl w-full flex-1 p-4 lg:p-6">
        {currentTab === 'lockers' ? (
          /* Vista: Matriz de Casilleros */
          <WarehouseMatrix
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={(item) => {
              setSelectedItemId(item.id);
              setCurrentTab('queue');
            }}
          />
        ) : currentTab === 'audit' ? (
          /* Vista: Bitácora Inmutable (RF-14) */
          <AuditLedger
            items={items}
            onSelectItem={(item) => {
              setSelectedItemId(item.id);
              setCurrentTab('queue');
            }}
          />
        ) : currentTab === 'citizen_reports' ? (
          /* Vista: Reportes Radicados por Ciudadanos y Aprendices */
          <CitizenReportsManager
            reports={citizenReports}
            items={items}
            onOpenChat={(threadId, title) => handleOpenChat(threadId, title)}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReport}
            onUpdateReportStatus={(reportId, status, matchedItemId) => {
              setCitizenReports((prev) =>
                prev.map((r) =>
                  r.id === reportId ? { ...r, status, matchedItemId } : r
                )
              );
              const rep = citizenReports.find((r) => r.id === reportId);
              const matchedItem = items.find((i) => i.id === matchedItemId);
              if (status === 'COINCIDENCIA_DETECTADA' && rep) {
                pushNotification({
                  title: `¡Coincidencia Detectada en tu Reporte ${rep.id}!`,
                  message: `Tu reporte "${rep.title}" coincide con el objeto en custodia ${
                    matchedItem?.trackingCode || matchedItemId
                  }. Coordina la entrega por el chat.`,
                  type: 'MATCH',
                  targetRole: 'client',
                  relatedThreadId: matchedItem?.trackingCode || rep.id,
                });
              }
            }}
            onConvertFoundToCustody={() => {
              setIsIntakeModalOpen(true);
            }}
            onSelectCustodyItem={(item) => {
              setSelectedItemId(item.id);
              setCurrentTab('queue');
            }}
          />
        ) : currentTab === 'users' ? (
          /* Vista: Gestión de Usuarios y Roles (Guardia de Autorización RBAC: Exclusivo Administrador RF-02) */
          restApi.hasPermission(currentUser, 'users:edit_role') ? (
            <UsersRoleManager
              users={users}
              currentUser={currentUser}
              onUpdateUserRole={(userId, newRole, badgeNumber, department) => {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === userId
                      ? {
                          ...u,
                          role: newRole,
                          badgeNumber: badgeNumber || u.badgeNumber,
                          department: department || u.department,
                        }
                      : u
                  )
                );
                if (currentUser.id === userId) {
                  setCurrentUser((prev) =>
                    prev
                      ? {
                          ...prev,
                          role: newRole,
                          badgeNumber: badgeNumber || prev.badgeNumber,
                          department: department || prev.department,
                        }
                      : null
                  );
                }
              }}
              onUpdateUserDetails={(updated) => {
                setUsers((prev) =>
                  prev.map((u) => (u.id === updated.id ? updated : u))
                );
                if (currentUser.id === updated.id) {
                  setCurrentUser(updated);
                }
              }}
              onCreateUser={(created) => {
                setUsers((prev) => [created, ...prev]);
              }}
              onDeleteUser={handleDeleteUser}
            />
          ) : (
            <div className="rounded-[2px] bg-white border border-black p-8 text-center space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#b5b5b5]">
                HTTP 403 FORBIDDEN · CONTROL DE AUTORIZACIÓN RBAC
              </span>
              <h3 className="text-[22px] font-medium text-black">
                Acceso Denegado: Permiso `users:edit_role` Requerido
              </h3>
              <p className="text-[13px] text-[#b5b5b5] max-w-md mx-auto">
                Tu rol actual ({currentUser.role}) no cuenta con autorización para administrar usuarios ni modificar roles (RF-02).
              </p>
            </div>
          )
        ) : currentTab === 'database' ? (
          /* Vista: Motor de Base de Datos Local y Consola API REST (/api/v1/...) */
          <DatabaseManagerView
            users={users}
            items={items}
            reports={citizenReports}
            currentUser={currentUser}
            isConnectedToFile={isDbConnectedToFile}
            lastSyncedAt={lastDbSyncTime}
            onDeleteItem={handleDeleteItem}
            onDeleteUser={handleDeleteUser}
            onDeleteReport={handleDeleteReport}
            onOpenCreateItem={() => setIsIntakeModalOpen(true)}
            onForceSync={() => {
              saveProjectDatabase(users, items, citizenReports).then((ok) => {
                setIsDbConnectedToFile(ok);
                setLastDbSyncTime(new Date().toISOString());
              });
            }}
            onResetDatabase={() => {
              setUsers(INITIAL_USERS);
              setItems(INITIAL_CUSTODY_ITEMS);
              setCitizenReports(INITIAL_CITIZEN_REPORTS);
            }}
          />
        ) : (
          /* Vista: Cola de Inventario y Validación (Master-Detail) */
          <div className="space-y-4">
            {/* Barra de Búsqueda y Filtros — Basic.Space Gallery Style */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] bg-white p-4 border border-[#ebebeb]">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b5b5b5]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por código (SOP-...), bien, marca, serie, casillero o custodio..."
                  className="w-full pl-10 pr-4 py-2 text-[13px] rounded-[16px] border border-[#ebebeb] bg-[#f7f7f7] focus:bg-white focus:border-black outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 text-[13px] rounded-full border border-[#ebebeb] bg-white font-normal text-black outline-none focus:border-black"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="EN_CUSTODIA">En Custodia Activa</option>
                  <option value="ADVERTENCIA">Con Intentos de Cliente</option>
                  <option value="BLOQUEADO_POR_SEGURIDAD">Restringidos para Cliente</option>
                  <option value="ENTREGADO">Entregados (Histórico)</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 text-[13px] rounded-full border border-[#ebebeb] bg-white font-normal text-black outline-none focus:border-black"
                >
                  <option value="all">Todas las Categorías</option>
                  <option value="electronics">Tecnología & Móviles</option>
                  <option value="wallets_ids">Billeteras & Docs</option>
                  <option value="luggage">Mochilas & Maletines</option>
                  <option value="keys">Llaves & Accesorios</option>
                  <option value="jewelry">Relojes & Joyas</option>
                  <option value="other">Otras Pertenencias</option>
                </select>

                {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="p-2 text-black border border-[#ebebeb] rounded-full hover:border-black transition cursor-pointer"
                    title="Restablecer filtros"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Layout Principal: Lista de Artículos (5 cols) + Detalle de Artículo (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Columna Izquierda: Cola de Artículos (5 columnas) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                  <span>{filteredItems.length} bienes encontrados</span>
                  <span>Ordenados por urgencia de custodia</span>
                </div>

                <div className="space-y-2.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onSelect={() => {
                        setSelectedItemId(item.id);
                        sfx.playClick();
                      }}
                    />
                  ))}

                  {filteredItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                      No se encontraron artículos con los filtros aplicados.
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Detalle Completo del Artículo (7 columnas) */}
              <div className="lg:col-span-7">
                {selectedItem ? (
                  <ItemDetailView
                    key={selectedItem.id}
                    item={selectedItem}
                    currentUserRole={currentUser.role}
                    onOpenValidationModal={() => setIsValidationModalOpen(true)}
                    onOpenAssetTagModal={() => setIsAssetTagModalOpen(true)}
                    onOpenSecurityHoldModal={() => setIsSecurityHoldModalOpen(true)}
                    onOpenChat={(threadId, title) => handleOpenChat(threadId, title)}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    onToggleDrawerLock={() => {
                      setItems((prev) =>
                        prev.map((i) =>
                          i.id === selectedItem.id
                            ? {
                                ...i,
                                location: {
                                  ...i.location,
                                  isLocked: !i.location.isLocked,
                                },
                              }
                            : i
                        )
                      );
                    }}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                    Seleccione un bien de la lista para ver su expediente y realizar validaciones.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES DEL SISTEMA */}

      {/* 1. Modal Protocolo de Validación Presencial 70%-80% (RF-08, RF-09, RF-10, RF-11) */}
      {selectedItem && (
        <ValidationProtocolModal
          item={selectedItem}
          isOpen={isValidationModalOpen}
          onClose={() => setIsValidationModalOpen(false)}
          onProceedToDelivery={handleProceedToDelivery}
          onRegisterFailedAttempt={handleRegisterFailedAttempt}
        />
      )}

      {/* 2. Modal Formalización de Entrega y Firma Digital (RF-12 / RF-13) */}
      {selectedItem && (
        <SignatureHandoffModal
          item={selectedItem}
          isOpen={isHandoffModalOpen}
          onClose={() => setIsHandoffModalOpen(false)}
          claimantPreset={validatedClaimant}
          onCompleteHandoff={handleCompleteHandoff}
        />
      )}

      {/* 3. Modal Registro Rápido con Fotografía <= 500 KB (RF-03 / RF-04) */}
      <RapidIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onSaveItem={handleSaveNewItem}
        nextItemCode={`SOP-2026-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(
          65 + Math.floor(Math.random() * 26)
        )}`}
      />

      {/* 4. Modal Rótulo Físico y RFID para Imprimir */}
      {selectedItem && (
        <AssetTagModal
          item={selectedItem}
          isOpen={isAssetTagModalOpen}
          onClose={() => setIsAssetTagModalOpen(false)}
        />
      )}

      {/* 5. Modal Bloqueo / Desbloqueo Judicial y Administrativo (RF-15) */}
      {selectedItem && (
        <SecurityHoldModal
          item={selectedItem}
          isOpen={isSecurityHoldModalOpen}
          currentUserRole={currentUser.role}
          onClose={() => setIsSecurityHoldModalOpen(false)}
          onApplyHold={handleApplySecurityHold}
          onRemoveHold={handleRemoveSecurityHold}
        />
      )}

      {/* 6. Cajón de Chat / Mensajería Directa entre Cliente y Empleado de Custodia */}
      <DirectChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        currentUser={currentUser}
        messages={messages}
        items={items}
        reports={citizenReports}
        activeThreadId={activeChatThreadId}
        activeThreadTitle={activeChatThreadTitle}
        onSelectThread={(threadId, title) => {
          setActiveChatThreadId(threadId);
          setActiveChatThreadTitle(title);
        }}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
}
