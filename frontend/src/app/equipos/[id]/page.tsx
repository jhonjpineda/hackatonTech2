'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teamService } from '@/services/team.service';
import { Team } from '@/types/team';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Crown,
  Mail,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TeamDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (id && token) {
      loadTeam();
    }
  }, [id, token]);

  const loadTeam = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await teamService.getById(id, token);
      setTeam(data);
    } catch (error: any) {
      console.error('Error al cargar equipo:', error);
      toast.error(error.message || 'Error al cargar el equipo');
      router.push('/equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !team) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await teamService.delete(team.id, token);
      toast.success('Equipo eliminado exitosamente');
      router.push('/equipos');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el equipo');
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!token || !team) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar a este miembro del equipo?'
    );

    if (!confirmed) return;

    try {
      await teamService.removeMember(team.id, memberId, token);
      toast.success('Miembro eliminado del equipo');
      loadTeam();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar miembro');
    }
  };

  const handleCopyCode = () => {
    if (team?.codigo) {
      navigator.clipboard.writeText(team.codigo);
      setCopiedCode(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isLeader = user?.id === team?.liderId;
  const isMember = team?.miembros?.some((m) => m.id === user?.id);
  const memberCount = (team?.miembros?.length || 0) + 1; // +1 por el líder

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando equipo...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Equipo no encontrado
          </h2>
          <Link
            href="/equipos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Equipos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/equipos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Equipos
          </Link>

          {isLeader && (
            <div className="flex items-center gap-3">
              <Link
                href={`/equipos/${team.id}/editar`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-5 w-5" />
                Editar
              </Link>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Header del equipo */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{team.nombre}</h1>
              {team.descripcion && (
                <p className="text-lg text-blue-100">{team.descripcion}</p>
              )}
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                team.activo
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-400 text-white'
              }`}
            >
              {team.activo ? 'Activo' : 'Inactivo'}
            </div>
          </div>

          {/* Código del equipo */}
          {team.codigo && (
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-blue-100 mb-1">Código del equipo</p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono font-bold">
                  {team.codigo}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copiar código"
                >
                  {copiedCode ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-blue-100 mt-2">
                Comparte este código con otros para que se unan al equipo
              </p>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Miembros</p>
                <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Crown className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Líder</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {team.lider
                    ? `${team.lider.nombres} ${team.lider.apellidos}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="text-lg font-bold text-gray-900">
                  {team.activo ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón para ver entregas del equipo */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Entregas del Equipo</h3>
                <p className="text-sm text-gray-600">
                  Ver todos los proyectos y entregas realizadas por este equipo
                </p>
              </div>
            </div>
            <Link
              href={`/equipos/${team.id}/entregas`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <FileText className="h-5 w-5" />
              Ver Entregas
            </Link>
          </div>
        </div>

        {/* Líder del equipo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Líder del Equipo
          </h2>
          {team.lider ? (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {team.lider.nombres.charAt(0)}
                {team.lider.apellidos.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {team.lider.nombres} {team.lider.apellidos}
                </p>
                <p className="text-sm text-gray-600">{team.lider.email}</p>
              </div>
              {isLeader && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Tú
                </span>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Información del líder no disponible</p>
          )}
        </div>

        {/* Miembros del equipo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Miembros ({team.miembros?.length || 0})
            </h2>
            {isLeader && (
              <button
                onClick={() => router.push(`/equipos/${team.id}/agregar-miembro`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Agregar Miembro
              </button>
            )}
          </div>

          {team.miembros && team.miembros.length > 0 ? (
            <div className="space-y-3">
              {team.miembros.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {member.nombres.charAt(0)}
                    {member.apellidos.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {member.nombres} {member.apellidos}
                    </p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  {member.id === user?.id && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Tú
                    </span>
                  )}
                  {isLeader && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar miembro"
                    >
                      <UserMinus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600">
                No hay miembros en este equipo aún
              </p>
              {isLeader && (
                <button
                  onClick={() => router.push(`/equipos/${team.id}/agregar-miembro`)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-5 w-5" />
                  Agregar Primer Miembro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información Adicional
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 mb-1">Fecha de creación</dt>
              <dd className="text-gray-900">
                {new Date(team.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-1">
                Última actualización
              </dt>
              <dd className="text-gray-900">
                {new Date(team.updatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </DashboardLayout>
  );
}
