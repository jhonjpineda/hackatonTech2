'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { userService, User } from '@/services/user.service';
import { Users, Search, MoreVertical, Edit, Trash2, UserCog, Shield } from 'lucide-react';
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

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

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
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
            <p className="text-sm text-gray-400">usuarios encontrados</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.nombres} {user.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.telefono || 'Sin teléfono'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.documento}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(user.source)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          disabled={user.id === currentUser?.id}
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openMenuId === user.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              {/* Opciones de cambio de rol */}
                              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                                Cambiar rol a:
                              </div>
                              {['CAMPISTA', 'JUEZ', 'ORGANIZADOR'].map((role) => (
                                user.role !== role && (
                                  <button
                                    key={role}
                                    onClick={() => handleChangeRole(user.id, role)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <UserCog className="h-4 w-4 mr-2" />
                                    {role}
                                  </button>
                                )
                              ))}

                              <div className="border-t border-gray-100"></div>

                              {/* Eliminar usuario */}
                              <button
                                onClick={() => handleDelete(user.id, `${user.nombres} ${user.apellidos}`)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar usuario
                              </button>
                            </div>
                          </div>
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
