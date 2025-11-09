'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import { organizerService, Organizer } from '@/services/organizer.service';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Users,
  Mail,
  Phone,
  CreditCard,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield
} from 'lucide-react';

export default function AdminOrganizadoresPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdOrganizer, setCreatedOrganizer] = useState<{
    user: Organizer;
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
    loadOrganizers(storedToken);
  }, [router]);

  const loadOrganizers = async (authToken: string) => {
    try {
      setLoadingOrganizers(true);
      const organizersData = await organizerService.getAll(authToken);
      setOrganizers(organizersData);
    } catch (error: any) {
      console.error('Error al cargar organizadores:', error);
      toast.error(error.message || 'Error al cargar organizadores');
    } finally {
      setLoadingOrganizers(false);
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
      const result = await organizerService.create(formData, token);

      setCreatedOrganizer(result);
      setShowPassword(true);

      toast.success('Organizador creado exitosamente');

      // Recargar lista de organizadores
      await loadOrganizers(token);

      // Limpiar formulario
      setFormData({
        documento: '',
        email: '',
        nombres: '',
        apellidos: '',
        telefono: '',
      });
    } catch (error: any) {
      console.error('Error al crear organizador:', error);
      toast.error(error.message || 'Error al crear organizador');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    if (createdOrganizer?.temporaryPassword) {
      navigator.clipboard.writeText(createdOrganizer.temporaryPassword);
      setCopiedPassword(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const closePasswordModal = () => {
    setCreatedOrganizer(null);
    setShowPassword(false);
    setShowForm(false);
  };

  if (!user || !token) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-200 text-lg">Cargando...</div>
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
            className="inline-flex items-center gap-2 text-gray-300 hover:text-brand-cyan mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-brand-purple" />
                Gestión de Organizadores
              </h1>
              <p className="mt-2 text-gray-300">
                Crea y administra usuarios con rol de organizador para gestionar hackathones
              </p>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/80 transition-colors font-medium shadow-lg"
              >
                <UserPlus className="h-5 w-5" />
                Crear Organizador
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && !createdOrganizer && (
          <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Nuevo Organizador</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-300 hover:text-brand-cyan transition-colors"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Documento <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    placeholder="Ej: 1234567890"
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="organizador@example.com"
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    placeholder="Ej: Juan Carlos"
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Ej: López García"
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-white placeholder-gray-400"
                    required
                  />
                </div>

                {/* Teléfono */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono (Opcional)
                    </div>
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Ej: 3001234567"
                    className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando...' : 'Crear Organizador'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Modal */}
        {showPassword && createdOrganizer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-navy rounded-lg border border-brand-purple p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  ¡Organizador Creado!
                </h3>
                <p className="text-gray-300">
                  {createdOrganizer.user.nombres} {createdOrganizer.user.apellidos}
                </p>
              </div>

              <div className="bg-brand-dark rounded-lg p-4 mb-6 border border-brand-purple/30">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Documento de acceso:</p>
                    <p className="text-white font-mono">{createdOrganizer.user.documento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Contraseña temporal:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-lg flex-1 break-all">
                        {createdOrganizer.temporaryPassword}
                      </p>
                      <button
                        onClick={copyPassword}
                        className="p-2 hover:bg-brand-purple/20 rounded transition-colors"
                        title="Copiar contraseña"
                      >
                        {copiedPassword ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-brand-cyan" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  ⚠️ <strong>Importante:</strong> Guarda esta contraseña ahora. El organizador deberá cambiarla en su primer inicio de sesión.
                </p>
              </div>

              <button
                onClick={closePasswordModal}
                className="w-full px-6 py-3 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Organizers List */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Organizadores Registrados ({organizers.length})
          </h2>

          {loadingOrganizers ? (
            <div className="text-center py-8">
              <div className="text-gray-300">Cargando organizadores...</div>
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No hay organizadores registrados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-purple/30">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Documento</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Teléfono</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-purple/20">
                  {organizers.map((organizer) => (
                    <tr key={organizer.id} className="hover:bg-brand-dark/50 transition-colors">
                      <td className="py-3 px-4 text-white">{organizer.documento}</td>
                      <td className="py-3 px-4 text-white">
                        {organizer.nombres} {organizer.apellidos}
                      </td>
                      <td className="py-3 px-4 text-gray-300">{organizer.email}</td>
                      <td className="py-3 px-4 text-gray-300">{organizer.telefono || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          organizer.status === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {organizer.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
