'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teamService } from '@/services/team.service';
import { Team } from '@/types/team';
import { Users, Plus, Search, UserPlus, Trash2, Crown, Mail } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EquiposPage() {
  const { user, token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (token && user) {
      loadTeams();
    } else if (!token && !user) {
      setLoading(false);
    }
  }, [token, user]);

  const loadTeams = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setHasError(false);
      const data = await teamService.getAll(token);
      setTeams(data || []);
    } catch (error: any) {
      console.error('Error al cargar equipos:', error);
      setHasError(true);
      setTeams([]);
      // Solo mostrar error si es un error real del servidor
      if (error.message && !error.message.includes('obtener')) {
        toast.error('No se pudieron cargar los equipos. Intenta crear uno nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      await teamService.delete(teamId, token);
      toast.success('Equipo eliminado exitosamente');
      loadTeams();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el equipo');
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separar equipos por si el usuario es líder o miembro
  const myTeamsAsLeader = filteredTeams.filter((team) => team.liderId === user?.id);
  const myTeamsAsMember = filteredTeams.filter(
    (team) =>
      team.liderId !== user?.id &&
      team.miembros?.some((m) => m.id === user?.id)
  );
  const otherTeams = filteredTeams.filter(
    (team) =>
      team.liderId !== user?.id &&
      !team.miembros?.some((m) => m.id === user?.id)
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando equipos...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Equipos</h1>
            <p className="mt-1 text-gray-600">
              Gestiona tus equipos para los hackathones
            </p>
          </div>
          <Link
            href="/equipos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Crear Equipo
          </Link>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar equipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mis Equipos (como líder) */}
        {myTeamsAsLeader.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              Mis Equipos (Líder)
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTeamsAsLeader.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isLeader={true}
                  currentUserId={user?.id}
                  onDelete={handleDeleteTeam}
                />
              ))}
            </div>
          </div>
        )}

        {/* Equipos donde soy miembro */}
        {myTeamsAsMember.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Equipos donde participo
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myTeamsAsMember.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isLeader={false}
                  currentUserId={user?.id}
                  onDelete={handleDeleteTeam}
                />
              ))}
            </div>
          </div>
        )}

        {/* Otros Equipos */}
        {otherTeams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Otros Equipos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isLeader={false}
                  currentUserId={user?.id}
                  onDelete={handleDeleteTeam}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {filteredTeams.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No hay equipos disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'No se encontraron equipos con ese nombre'
                : 'Crea tu primer equipo para empezar'}
            </p>
            {!searchTerm && (
              <Link
                href="/equipos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Crear Equipo
              </Link>
            )}
          </div>
        )}

        {/* Contador */}
        {filteredTeams.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Mostrando {filteredTeams.length} de {teams.length} equipos
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente de tarjeta de equipo
interface TeamCardProps {
  team: Team;
  isLeader: boolean;
  currentUserId?: string;
  onDelete: (teamId: string) => void;
}

function TeamCard({ team, isLeader, currentUserId, onDelete }: TeamCardProps) {
  const memberCount = (team.miembros?.length || 0) + 1; // +1 por el líder

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              {team.nombre}
            </h3>
            {team.codigo && (
              <p className="text-sm text-blue-100 font-mono">
                Código: {team.codigo}
              </p>
            )}
          </div>
          {isLeader && (
            <div className="relative group">
              <Crown className="h-5 w-5 text-yellow-300" />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Eres el líder
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Descripción */}
        {team.descripcion && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {team.descripcion}
          </p>
        )}

        {/* Líder */}
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Líder</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {team.lider
                ? `${team.lider.nombres} ${team.lider.apellidos}`
                : 'Líder no disponible'}
            </p>
          </div>
        </div>

        {/* Miembros */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Miembros</p>
            <p className="text-sm font-medium text-gray-900">
              {memberCount} {memberCount === 1 ? 'persona' : 'personas'}
            </p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              team.activo ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm text-gray-600">
            {team.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/equipos/${team.id}`}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Ver Detalles
          </Link>
          {isLeader && (
            <button
              onClick={() => onDelete(team.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar equipo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
