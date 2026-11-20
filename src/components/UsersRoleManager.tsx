import React, { useState } from 'react';
import {
  Users,
  Shield,
  User,
  Building,
  Search,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  UserPlus,
  KeyRound,
  Filter,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  BadgeCheck,
  X,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { SessionUser, UserRole } from '../types/custody';
import { sfx } from '../utils/audio';

interface UsersRoleManagerProps {
  users: SessionUser[];
  currentUser: SessionUser;
  onUpdateUserRole: (userId: string, newRole: UserRole, badgeNumber?: string, department?: string) => void;
  onUpdateUserDetails: (updatedUser: SessionUser) => void;
  onCreateUser: (newUser: SessionUser) => void;
  onDeleteUser?: (userId: string) => void;
}

export const UsersRoleManager: React.FC<UsersRoleManagerProps> = ({
  users,
  currentUser,
  onUpdateUserRole,
  onUpdateUserDetails,
  onCreateUser,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<SessionUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states para edición
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editBadge, setEditBadge] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  // Form states para creación directa por admin
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newBadge, setNewBadge] = useState('ADSO-REC-');
  const [newDepartment, setNewDepartment] = useState('Centro de Recepción · Bloque Central');
  const [newPhone, setNewPhone] = useState('+57 3');

  const isAdmin = currentUser.role === 'admin';

  // Conteos
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const employeeCount = users.filter((u) => u.role === 'employee').length;
  const clientCount = users.filter((u) => u.role === 'user').length;

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.badgeNumber && u.badgeNumber.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleOpenEdit = (user: SessionUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditBadge(user.badgeNumber || '');
    setEditDepartment(user.department || '');
    setEditPhone(user.phone || '');
    setEditStatus(user.status || 'ACTIVO');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    sfx.playVerificationSuccess();

    const updated: SessionUser = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      badgeNumber: editRole === 'user' ? undefined : (editBadge.trim() || undefined),
      department: editRole === 'user' ? 'Comunidad Educativa y Clientes' : editDepartment.trim(),
      phone: editPhone.trim() || undefined,
      status: editStatus,
    };

    onUpdateUserDetails(updated);
    setEditingUser(null);
    alert(`El perfil y rol de [${updated.name}] se han actualizado correctamente.`);
  };

  const handleQuickRoleChange = (userId: string, newRole: UserRole) => {
    sfx.playVerificationSuccess();
    const user = users.find((u) => u.id === userId);
    let badge = user?.badgeNumber;
    let dept = user?.department;

    if (newRole === 'admin') {
      badge = badge || 'ADSO-ADMIN-0' + Math.floor(2 + Math.random() * 8);
      dept = dept || 'Mando Central y Asuntos Jurídicos';
    } else if (newRole === 'employee') {
      badge = badge || 'ADSO-REC-341' + Math.floor(100 + Math.random() * 900);
      dept = dept || 'Mostrador de Recepción y Control';
    } else {
      dept = 'Comunidad Educativa y Clientes';
    }

    onUpdateUserRole(userId, newRole, badge, dept);
  };

  const handleCreateNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Por favor complete el nombre y correo del usuario.');
      return;
    }

    sfx.playVerificationSuccess();

    const created: SessionUser = {
      id: 'user-' + Date.now(),
      name: newName.trim(),
      email: newEmail.trim(),
      password: '123456',
      role: newRole,
      badgeNumber: newRole === 'user' ? undefined : newBadge.trim(),
      department: newDepartment.trim(),
      phone: newPhone.trim() || undefined,
      createdAt: new Date().toLocaleDateString('es-CO'),
      status: 'ACTIVO',
    };

    onCreateUser(created);
    setIsCreateModalOpen(false);

    // Reset
    setNewName('');
    setNewEmail('');
    alert(`Usuario [${created.name}] creado exitosamente con rol ${created.role.toUpperCase()}.`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Gestión de Empleados, Usuarios y Roles (RBAC · RF-02 / CU-02)
            </h2>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-800">
              Control de Acceso
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Panel exclusivo de administración para asignar, promover y editar roles institucionales (Administrador, Empleado, Cliente).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Registrar Nuevo Funcionario / Usuario</span>
        </button>
      </div>

      {/* Tarjetas de Métricas de Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Usuarios</span>
          <p className="font-heading text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
          <span className="text-[11px] text-slate-500 font-mono">Registrados en sistema</span>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-purple-600" />
            Administradores
          </span>
          <p className="font-heading text-2xl font-black text-purple-900 mt-1">{adminCount}</p>
          <span className="text-[11px] text-purple-700 font-mono">ROLE_ADMIN</span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-blue-600" />
            Empleados Custodia
          </span>
          <p className="font-heading text-2xl font-black text-blue-900 mt-1">{employeeCount}</p>
          <span className="text-[11px] text-blue-700 font-mono">ROLE_EMPLEADO</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-emerald-600" />
            Clientes / Ciudadanos
          </span>
          <p className="font-heading text-2xl font-black text-emerald-900 mt-1">{clientCount}</p>
          <span className="text-[11px] text-emerald-700 font-mono">Rol inicial auto-registro</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, placa, cargo o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              roleFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              roleFilter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Admins ({adminCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('employee')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              roleFilter === 'employee'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Empleados ({employeeCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('user')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              roleFilter === 'user'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Clientes ({clientCount})
          </button>
        </div>
      </div>

      {/* Tabla de Usuarios y Edición de Roles */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] font-bold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Usuario / Perfil</th>
                <th className="px-4 py-3">Contacto / Correo</th>
                <th className="px-4 py-3">Placa / Dependencia</th>
                <th className="px-4 py-3">Rol Actual (RBAC)</th>
                <th className="px-4 py-3 text-center">Cambio Rápido de Rol</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isUserAdmin = user.role === 'admin';
                const isUserEmployee = user.role === 'employee';
                const isUserClient = user.role === 'user';
                const isSelf = user.id === currentUser.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition">
                    {/* Usuario */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs uppercase ${
                            isUserAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : isUserEmployee
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{user.name}</span>
                            {isSelf && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] text-slate-600 font-bold">
                                (Tú)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: {user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 font-medium">{user.email}</div>
                      {user.phone && (
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {user.phone}
                        </div>
                      )}
                    </td>

                    {/* Placa y Dependencia */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-700">
                        {user.badgeNumber || 'N/A (Cliente)'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {user.department || 'Comunidad General'}
                      </div>
                    </td>

                    {/* Insignia de Rol */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isUserAdmin
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isUserEmployee
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isUserAdmin && <Shield className="h-3.5 w-3.5 text-purple-600" />}
                        {isUserEmployee && <User className="h-3.5 w-3.5 text-blue-600" />}
                        {isUserClient && <Building className="h-3.5 w-3.5 text-emerald-600" />}
                        <span>
                          {isUserAdmin
                            ? 'ADMINISTRADOR'
                            : isUserEmployee
                            ? 'EMPLEADO CUSTODIA'
                            : 'CLIENTE / CIUDADANO'}
                        </span>
                      </span>
                    </td>

                    {/* Selector Rápido de Rol */}
                    <td className="px-4 py-3.5 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleQuickRoleChange(user.id, e.target.value as UserRole)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none transition ${
                          isUserAdmin
                            ? 'border-purple-300 bg-purple-50 text-purple-900'
                            : isUserEmployee
                            ? 'border-blue-300 bg-blue-50 text-blue-900'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        }`}
                      >
                        <option value="user">Cliente (user)</option>
                        <option value="employee">Empleado (employee)</option>
                        <option value="admin">Administrador (admin)</option>
                      </select>
                    </td>

                    {/* Acciones CRUD: Editar (U) y Eliminar (D) */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Editar</span>
                        </button>

                        {onDeleteUser && !isSelf && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Deseas eliminar permanentemente al usuario [${user.name} - ${user.email}] de la base de datos?`
                                )
                              ) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Perfil y Rol Completo */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Editar Usuario y Rol (RF-02)
                </h3>
                <p className="font-mono text-xs text-slate-500">{editingUser.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-950 mb-1">
                    Rol Asignado (RBAC) *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border-2 border-purple-300 p-2 text-xs font-bold text-purple-950 focus:outline-none bg-purple-50"
                  >
                    <option value="user">Cliente / Ciudadano</option>
                    <option value="employee">Empleado de Custodia</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado de la Cuenta</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVO' | 'INACTIVO')}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo / Bloqueado</option>
                  </select>
                </div>
              </div>

              {editRole !== 'user' && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Placa / Credencial</label>
                    <input
                      type="text"
                      value={editBadge}
                      onChange={(e) => setEditBadge(e.target.value)}
                      placeholder="Ej. ADSO-REC-3413988"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dependencia / Sede</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      placeholder="Ej. Recepción Bloque A"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono / Celular</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
              >
                Guardar Modificaciones (RF-02)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Crear Nuevo Usuario Directo */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateNewUserSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Registrar Nuevo Usuario / Funcionario
                </h3>
                <p className="text-xs text-slate-500">
                  Creación directa desde el panel de Administrador
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Laura Marcela Ortiz"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="laura.ortiz@sena.edu.co"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-950 mb-1">Rol a Asignar *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border-2 border-purple-300 p-2 text-xs font-bold text-purple-950 focus:outline-none bg-purple-50"
                  >
                    <option value="employee">Empleado de Custodia</option>
                    <option value="admin">Administrador General</option>
                    <option value="user">Cliente / Ciudadano</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              {newRole !== 'user' && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Número de Placa</label>
                    <input
                      type="text"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dependencia / Puesto</label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
              >
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

