'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Users,
  Mail,
  Phone,
  IdCard,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

export default function AdminJuecesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [judges, setJudges] = useState<User[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdJudge, setCreatedJudge] = useState<{
    user: User;
    temporaryPassword: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    documento: '',
    email: '',
    nombres: '',
    apellidos: '',
    telefono: '',
  });

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getToken();

    if (!storedUser || !storedToken) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (storedUser.role !== 'ORGANIZADOR') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
      return;
    }

    setUser(storedUser);
    setToken(storedToken);
    loadJudges(storedToken);
  }, [router]);

  const loadJudges = async (authToken: string) => {
    try {
      setLoadingJudges(true);
      const judgesData = await authService.getAllJudges();
      setJudges(judgesData);
    } catch (error: any) {
      console.error('Error al cargar jueces:', error);
      toast.error(error.message || 'Error al cargar jueces');
    } finally {
      setLoadingJudges(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Debes iniciar sesión');
      return;
    }

    // Validaciones
    if (!formData.documento || !formData.email || !formData.nombres || !formData.apellidos) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    try {
      setLoading(true);
      const result = await authService.createJudge(formData);

      setCreatedJudge(result);
      setShowPassword(true);

      toast.success('Juez creado exitosamente');

      // Recargar lista de jueces
      await loadJudges(token);

      // Limpiar formulario
      setFormData({
        documento: '',
        email: '',
        nombres: '',
        apellidos: '',
        telefono: '',
      });
    } catch (error: any) {
      console.error('Error al crear juez:', error);
      toast.error(error.message || 'Error al crear juez');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (createdJudge?.temporaryPassword) {
      navigator.clipboard.writeText(createdJudge.temporaryPassword);
      setCopiedPassword(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const closePasswordModal = () => {
    setCreatedJudge(null);
    setShowPassword(false);
    setShowForm(false);
  };

  if (!user || !token) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Cargando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-600" />
                Gestión de Jueces
              </h1>
              <p className="mt-2 text-gray-600">
                Crea y administra usuarios con rol de juez para evaluar hackathones
              </p>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <UserPlus className="h-5 w-5" />
                Crear Juez
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && !createdJudge && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Juez</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Identidad *
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: 1234567890"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="juez@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    id="nombres"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Juan Carlos"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Pérez García"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono (opcional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-700">
                  <strong>Nota:</strong> Se generará una contraseña temporal que se enviará por email al juez.
                  El juez deberá cambiar su contraseña en el primer inicio de sesión.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Juez'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Modal */}
        {createdJudge && showPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Juez Creado Exitosamente
              </h3>

              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900 mb-2">
                    Juez: {createdJudge.user.nombres} {createdJudge.user.apellidos}
                  </p>
                  <p className="text-sm text-purple-700">
                    Email: {createdJudge.user.email}
                  </p>
                  <p className="text-sm text-purple-700">
                    Documento: {createdJudge.user.documento}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    Contraseña Temporal:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-yellow-300 rounded font-mono text-sm">
                      {createdJudge.temporaryPassword}
                    </code>
                    <button
                      onClick={copyPassword}
                      className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                      title="Copiar contraseña"
                    >
                      {copiedPassword ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">
                    <strong>Importante:</strong> Guarda esta contraseña ahora. No podrás verla nuevamente.
                    Se ha enviado un email al juez con sus credenciales.
                  </p>
                </div>
              </div>

              <button
                onClick={closePasswordModal}
                className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Judges List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Jueces Registrados ({judges.length})
            </h2>
          </div>

          <div className="p-6">
            {loadingJudges ? (
              <div className="text-center py-8 text-gray-600">
                Cargando jueces...
              </div>
            ) : judges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay jueces registrados aún
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {judges.map((judge) => (
                      <tr key={judge.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {judge.nombres} {judge.apellidos}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {judge.documento}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {judge.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {judge.telefono || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            judge.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {judge.status === 'ACTIVE' ? 'Activo' : judge.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/jueces/${judge.id}/asignaciones`}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            Ver Asignaciones
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
