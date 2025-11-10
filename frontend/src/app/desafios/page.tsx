'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { challengeService } from '@/services/challenge.service';
import { Challenge, ChallengeDifficulty, ChallengeStatus } from '@/types/challenge';
import { Code2, Plus, Search, Trophy, Calendar, Award, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DesafiosPage() {
  const { user, token } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<ChallengeDifficulty | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<ChallengeStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (token) {
      loadChallenges();
    }
  }, [token]);

  const loadChallenges = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await challengeService.getAll(token);
      setChallenges(data);
    } catch (error: any) {
      console.error('Error al cargar desafíos:', error);
      toast.error(error.message || 'Error al cargar los desafíos');
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch = challenge.titulo
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      filterDifficulty === 'ALL' || challenge.dificultad === filterDifficulty;
    const matchesStatus =
      filterStatus === 'ALL' || challenge.estado === filterStatus;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  // Separar por estado si es organizador
  const publishedChallenges = filteredChallenges.filter(
    (c) => c.estado === ChallengeStatus.PUBLISHED
  );
  const draftChallenges = filteredChallenges.filter(
    (c) => c.estado === ChallengeStatus.DRAFT
  );
  const closedChallenges = filteredChallenges.filter(
    (c) => c.estado === ChallengeStatus.CLOSED
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando desafíos...</p>
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
            <h1 className="text-3xl font-bold text-white">Desafíos</h1>
            <p className="mt-1 text-gray-300">
              {user?.role === 'ORGANIZADOR'
                ? 'Gestiona los desafíos de tus hackathones'
                : 'Explora y resuelve desafíos de los hackathones'}
            </p>
          </div>
          {user?.role === 'ORGANIZADOR' && (
            <Link
              href="/desafios/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nuevo Desafío
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar desafíos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por dificultad */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) =>
                  setFilterDifficulty(e.target.value as ChallengeDifficulty | 'ALL')
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">Todas las dificultades</option>
                <option value={ChallengeDifficulty.FACIL}>Fácil</option>
                <option value={ChallengeDifficulty.MEDIO}>Medio</option>
                <option value={ChallengeDifficulty.DIFICIL}>Difícil</option>
                <option value={ChallengeDifficulty.EXPERTO}>Experto</option>
              </select>
            </div>

            {/* Filtro por estado */}
            {user?.role === 'ORGANIZADOR' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as ChallengeStatus | 'ALL')
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value={ChallengeStatus.DRAFT}>Borrador</option>
                  <option value={ChallengeStatus.PUBLISHED}>Publicado</option>
                  <option value={ChallengeStatus.CLOSED}>Cerrado</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Desafíos Publicados */}
        {publishedChallenges.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-green-600" />
              Desafíos Activos ({publishedChallenges.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publishedChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {/* Borradores (solo organizadores) */}
        {user?.role === 'ORGANIZADOR' && draftChallenges.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Code2 className="h-6 w-6 text-gray-600" />
              Borradores ({draftChallenges.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {draftChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {/* Cerrados */}
        {closedChallenges.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-600" />
              Desafíos Cerrados ({closedChallenges.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {closedChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {filteredChallenges.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Code2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No hay desafíos disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'No se encontraron desafíos con ese criterio'
                : user?.role === 'ORGANIZADOR'
                ? 'Crea tu primer desafío para empezar'
                : 'No hay desafíos publicados en este momento'}
            </p>
            {user?.role === 'ORGANIZADOR' && !searchTerm && (
              <Link
                href="/desafios/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Crear Desafío
              </Link>
            )}
          </div>
        )}

        {/* Contador */}
        {filteredChallenges.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Mostrando {filteredChallenges.length} de {challenges.length} desafíos
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente de tarjeta de desafío
interface ChallengeCardProps {
  challenge: Challenge;
}

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    const colors = {
      [ChallengeDifficulty.FACIL]: 'bg-green-100 text-green-800',
      [ChallengeDifficulty.MEDIO]: 'bg-yellow-100 text-yellow-800',
      [ChallengeDifficulty.DIFICIL]: 'bg-orange-100 text-orange-800',
      [ChallengeDifficulty.EXPERTO]: 'bg-red-100 text-red-800',
    };
    return colors[difficulty];
  };

  const getDifficultyText = (difficulty: ChallengeDifficulty) => {
    const text = {
      [ChallengeDifficulty.FACIL]: 'Fácil',
      [ChallengeDifficulty.MEDIO]: 'Medio',
      [ChallengeDifficulty.DIFICIL]: 'Difícil',
      [ChallengeDifficulty.EXPERTO]: 'Experto',
    };
    return text[difficulty];
  };

  const getStatusBadge = (estado: ChallengeStatus) => {
    const badges = {
      [ChallengeStatus.DRAFT]: {
        text: 'Borrador',
        className: 'bg-gray-100 text-gray-800',
      },
      [ChallengeStatus.PUBLISHED]: {
        text: 'Publicado',
        className: 'bg-green-100 text-green-800',
      },
      [ChallengeStatus.CLOSED]: {
        text: 'Cerrado',
        className: 'bg-purple-100 text-purple-800',
      },
    };
    return badges[estado];
  };

  const statusBadge = getStatusBadge(challenge.estado);

  return (
    <Link href={`/desafios/${challenge.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-4">
          <div className="flex items-start justify-between mb-2">
            <Code2 className="h-8 w-8 text-white" />
            <div className="flex flex-col gap-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
              >
                {statusBadge.text}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                  challenge.dificultad
                )}`}
              >
                {getDifficultyText(challenge.dificultad)}
              </span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors">
            {challenge.titulo}
          </h3>
        </div>

        {/* Contenido */}
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
            {challenge.descripcion}
          </p>

          {/* Información */}
          <div className="space-y-2">
            {/* Puntos */}
            {challenge.puntos && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-gray-700">
                  {challenge.puntos} puntos
                </span>
              </div>
            )}

            {/* Fecha límite */}
            {challenge.fechaLimite && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Límite: {format(new Date(challenge.fechaLimite), 'dd MMM yyyy', {
                    locale: es,
                  })}
                </span>
              </div>
            )}

            {/* Categoría */}
            {challenge.category && (
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                {challenge.category.nombre}
                {challenge.category.topic && ` • ${challenge.category.topic.nombre}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
