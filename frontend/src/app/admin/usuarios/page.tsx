'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { userService, User } from '@/services/user.service';
import { Users, Search, MoreVertical, Edit, Trash2, UserCog, Shield, RefreshCw, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function UsuariosPage() {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

  // Sincronización SIGA
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  useEffect(() => {
    paginateUsers();
  }, [filteredUsers, currentPage]);

  const loadUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await userService.getAll(token);
      setUsers(data);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filtro por búsqueda (documento, nombres, apellidos, email)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.documento.toLowerCase().includes(searchLower) ||
          user.nombres.toLowerCase().includes(searchLower) ||
          user.apellidos.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por rol
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  };

  const paginateUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSyncFromSiga = async () => {
    if (!token) {
      toast.error('Debes estar autenticado');
      return;
    }

    const confirmSync = confirm(
      '¿Estás seguro de sincronizar usuarios desde SIGA?\n\n' +
      'Esto traerá TODOS los usuarios aprobados del reporte 1003 de SIGA ' +
      '(aproximadamente 58,158 usuarios) y los creará/actualizará en la base de datos.\n\n' +
      'Este proceso puede tardar varios minutos.'
    );

    if (!confirmSync) return;

    try {
      setSyncing(true);
      toast.loading('Sincronizando usuarios desde SIGA...', { id: 'sync' });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/siga/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onlyApproved: true, // Solo usuarios aprobados
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al sincronizar');
      }

      const data = await response.json();

      toast.success(
        `¡Sincronización completada!\n` +
        `✅ ${data.data.created} usuarios creados\n` +
        `🔄 ${data.data.updated} usuarios actualizados\n` +
        `❌ ${data.data.errors} errores`,
        { id: 'sync', duration: 6000 }
      );

      // Recargar la lista de usuarios
      await loadUsers();
    } catch (error: any) {
      console.error('Error sincronizando desde SIGA:', error);
      toast.error(error.message || 'Error al sincronizar usuarios desde SIGA', { id: 'sync' });
    } finally {
      setSyncing(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!token) return;

    if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole}?`)) {
      return;
    }

    try {
      await userService.updateRole(userId, newRole, token);
      toast.success('Rol actualizado exitosamente');
      loadUsers();
      setOpenMenuId(null);
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar rol');
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;

    if (!confirm(`¿Estás seguro de eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await userService.delete(userId, token);
      toast.success('Usuario eliminado exitosamente');
      loadUsers();
      setOpenMenuId(null);
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ORGANIZADOR':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'JUEZ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CAMPISTA':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSourceBadge = (source?: string) => {
    if (source === 'SIGA') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">SIGA</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Directo</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-500" />
              Gestión de Usuarios
            </h1>
            <p className="mt-1 text-gray-300">
              Administra todos los usuarios del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSyncFromSiga}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  Sincronizar SIGA
                </>
              )}
            </button>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
              <p className="text-sm text-gray-400">usuarios encontrados</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por documento, nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por rol */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todos los roles</option>
              <option value="ORGANIZADOR">Organizadores</option>
              <option value="JUEZ">Jueces</option>
              <option value="CAMPISTA">Campistas</option>
            </select>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-medium text-gray-900">
                            {user.nombres} {user.apellidos}
                          </div>
                          {user.telefono && (
                            <div className="text-xs text-gray-500">
                              {user.telefono}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{user.documento}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getSourceBadge(user.source)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-lg hover:bg-gray-100 transition-colors"
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'No puedes modificar tu propio usuario' : 'Acciones'}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openMenuId === user.id && (
                          <>
                            {/* Overlay para cerrar el menú al hacer clic fuera */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            ></div>

                            {/* Menú emergente */}
                            <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-lg shadow-2xl bg-white border border-gray-200 z-20 overflow-hidden">
                              {/* Header del menú */}
                              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Acciones
                                </p>
                              </div>

                              <div className="py-2">
                                {/* Sección: Ver detalles */}
                                <button
                                  onClick={() => {
                                    toast('Función en desarrollo', { icon: 'ℹ️' });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="font-medium">Ver detalles</span>
                                </button>

                                {/* Separador */}
                                <div className="border-t border-gray-100 my-2"></div>

                                {/* Sección: Cambiar rol */}
                                <div className="px-4 py-2">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Cambiar rol a:
                                  </p>
                                </div>

                                {['CAMPISTA', 'JUEZ', 'ORGANIZADOR'].map((role) => {
                                  if (user.role === role) return null;

                                  const roleConfig = {
                                    CAMPISTA: { color: 'green', icon: Users },
                                    JUEZ: { color: 'blue', icon: UserCog },
                                    ORGANIZADOR: { color: 'purple', icon: Shield },
                                  }[role] || { color: 'gray', icon: UserCog };

                                  const RoleIcon = roleConfig.icon;

                                  return (
                                    <button
                                      key={role}
                                      onClick={() => handleChangeRole(user.id, role)}
                                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${roleConfig.color}-100 flex items-center justify-center mr-3`}>
                                        <RoleIcon className={`h-4 w-4 text-${roleConfig.color}-600`} />
                                      </div>
                                      <span className="font-medium">{role}</span>
                                    </button>
                                  );
                                })}

                                {/* Separador */}
                                <div className="border-t border-gray-100 my-2"></div>

                                {/* Sección: Rechazar/Eliminar */}
                                <button
                                  onClick={() => handleDelete(user.id, `${user.nombres} ${user.apellidos}`)}
                                  className="flex items-center w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </div>
                                  <span className="font-medium">Rechazar</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'ALL'
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'No hay usuarios registrados en el sistema'}
              </p>
            </div>
          )}

          {/* Paginación */}
          {filteredUsers.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{filteredUsers.length}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        ‹
                      </button>

                      {/* Números de página */}
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 7) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 4) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNumber = totalPages - 6 + i;
                        } else {
                          pageNumber = currentPage - 3 + i;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Siguiente</span>
                        ›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Organizadores</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'ORGANIZADOR').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Jueces</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'JUEZ').length}
                </p>
              </div>
              <UserCog className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Campistas</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'CAMPISTA').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
