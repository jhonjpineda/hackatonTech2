'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { submissionService } from '@/services/submission.service';
import { challengeService } from '@/services/challenge.service';
import { Submission, SubmissionStatus } from '@/types/submission';
import { Challenge } from '@/types/challenge';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Users, Trophy, Eye, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { StatusBadge } from '@/components/submissions/StatusBadge';

type FilterStatus = 'ALL' | SubmissionStatus;

export default function ChallengeSubmissionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const challengeId = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Solo jueces y organizadores pueden acceder
    if (user.role !== 'JUEZ' && user.role !== 'ORGANIZADOR') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/dashboard');
      return;
    }

    if (challengeId && token) {
      loadData();
    }
  }, [challengeId, token, user]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [challengeData, submissionsData] = await Promise.all([
        challengeService.getById(challengeId),
        submissionService.getByChallenge(challengeId, token),
      ]);
      setChallenge(challengeData);
      setSubmissions(submissionsData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar la información');
      router.push('/desafios');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    if (filterStatus === 'ALL') return true;
    return submission.status === filterStatus;
  });

  const stats = {
    total: submissions.length,
    submitted: submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED).length,
    underReview: submissions.filter((s) => s.status === SubmissionStatus.UNDER_REVIEW).length,
    evaluated: submissions.filter((s) => s.status === SubmissionStatus.EVALUATED).length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando entregas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/desafios/${challengeId}`}
            className="inline-flex items-center text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al desafío
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Entregas del Desafío
          </h1>

          {challenge && (
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              {challenge.titulo}
            </p>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.submitted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Filter className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En revisión</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.underReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Evaluadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.evaluated}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar por estado:
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Todas ({submissions.length})
              </button>
              <button
                onClick={() => setFilterStatus(SubmissionStatus.SUBMITTED)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === SubmissionStatus.SUBMITTED
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Enviadas ({stats.submitted})
              </button>
              <button
                onClick={() => setFilterStatus(SubmissionStatus.UNDER_REVIEW)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === SubmissionStatus.UNDER_REVIEW
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                En revisión ({stats.underReview})
              </button>
              <button
                onClick={() => setFilterStatus(SubmissionStatus.EVALUATED)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === SubmissionStatus.EVALUATED
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                Evaluadas ({stats.evaluated})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de entregas */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay entregas
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filterStatus === 'ALL'
                ? 'Aún no hay entregas para este desafío'
                : 'No hay entregas con el estado seleccionado'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                        {submission.titulo}
                      </h3>
                      <StatusBadge status={submission.status} />
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {submission.descripcion}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{submission.team?.nombre || 'Sin equipo'}</span>
                      </div>
                      {submission.repositorioUrl && (
                        <a
                          href={submission.repositorioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver repositorio
                        </a>
                      )}
                      {submission.puntajeFinal !== null && submission.puntajeFinal !== undefined && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <Trophy className="h-4 w-4" />
                          <span>{submission.puntajeFinal} puntos</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <Link
                    href={`/entregas/${submission.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalle
                  </Link>
                </div>

                {/* Tecnologías */}
                {submission.tecnologias && (() => {
                  try {
                    const techs = typeof submission.tecnologias === 'string'
                      ? JSON.parse(submission.tecnologias)
                      : submission.tecnologias;
                    return Array.isArray(techs) && techs.length > 0 ? (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {techs.map((tech, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>
            ))}
          </div>
        )}

        {/* Botón para ver leaderboard */}
        {submissions.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href={`/desafios/${challengeId}/leaderboard`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              <Trophy className="h-5 w-5" />
              Ver Tabla de Clasificación
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
