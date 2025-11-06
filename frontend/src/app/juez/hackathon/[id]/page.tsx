'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import { judgeAssignmentService } from '@/services/judge-assignment.service';
import { challengeService, Challenge } from '@/services/challenge.service';
import { submissionService } from '@/services/submission.service';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, Users, Target, Award, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Submission {
  id: string;
  titulo: string;
  descripcion: string;
  urlArchivo?: string;
  status: string;
  puntajeFinal?: number;
  team: {
    id: string;
    nombre: string;
  };
  challenge: {
    id: string;
    titulo: string;
  };
  submittedAt?: string;
}

export default function JuezHackathonSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hackathon, setHackathon] = useState<any>(null);
  const [accessibleTeams, setAccessibleTeams] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all');

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getToken();

    if (!storedUser || !storedToken) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (storedUser.role !== 'JUEZ') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
      return;
    }

    setUser(storedUser);
    setToken(storedToken);
    loadData(storedToken);
  }, [router, hackathonId]);

  const loadData = async (authToken: string) => {
    try {
      setLoading(true);

      // Cargar hackathon
      const hackathonResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/hackathons/${hackathonId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (hackathonResponse.ok) {
        const hackathonData = await hackathonResponse.json();
        setHackathon(hackathonData);
      }

      // Cargar equipos accesibles
      const teams = await judgeAssignmentService.getAccessibleTeams(hackathonId, authToken);
      setAccessibleTeams(teams);

      // Cargar challenges del hackathon
      const categoriesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories/hackathon/${hackathonId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        const allChallenges: Challenge[] = [];

        for (const category of categories) {
          try {
            const categoryChallenges = await challengeService.getByCategory(category.id);
            allChallenges.push(...categoryChallenges);
          } catch (error) {
            console.error(`Error loading challenges for category ${category.id}:`, error);
          }
        }

        setChallenges(allChallenges);

        // Cargar submissions de los equipos accesibles
        const teamIds = teams.map((t: any) => t.id);
        const allSubmissions: Submission[] = [];

        for (const teamId of teamIds) {
          try {
            const teamSubmissions = await submissionService.getByTeam(teamId, authToken);
            allSubmissions.push(...teamSubmissions);
          } catch (error) {
            console.error(`Error loading submissions for team ${teamId}:`, error);
          }
        }

        setSubmissions(allSubmissions);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSubmissions = () => {
    if (filter === 'all') return submissions;
    if (filter === 'pending') {
      return submissions.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW'
      );
    }
    return submissions.filter((s) => s.status === 'EVALUATED');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      DRAFT: {
        label: 'Borrador',
        className: 'bg-gray-100 text-gray-700',
        icon: FileText,
      },
      SUBMITTED: {
        label: 'Enviada',
        className: 'bg-blue-100 text-blue-700',
        icon: FileText,
      },
      UNDER_REVIEW: {
        label: 'En Revisión',
        className: 'bg-yellow-100 text-yellow-700',
        icon: Clock,
      },
      EVALUATED: {
        label: 'Evaluada',
        className: 'bg-green-100 text-green-700',
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/juez"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Asignaciones
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {hackathon?.nombre || 'Cargando...'}
            </h1>
            {hackathon && (
              <p className="text-gray-600">{hackathon.descripcion}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Equipos Accesibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accessibleTeams.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Desafíos</p>
                <p className="text-2xl font-bold text-gray-900">{challenges.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Entregas</p>
                <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    submissions.filter(
                      (s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW'
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({submissions.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes (
                {
                  submissions.filter(
                    (s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW'
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setFilter('evaluated')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'evaluated'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Evaluadas ({submissions.filter((s) => s.status === 'EVALUATED').length})
              </button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Entregas para Evaluar
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-600">Cargando entregas...</div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filter === 'all'
                    ? 'No hay entregas disponibles'
                    : filter === 'pending'
                    ? 'No hay entregas pendientes de evaluación'
                    : 'No hay entregas evaluadas'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {submission.titulo}
                          </h3>
                          {getStatusBadge(submission.status)}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {submission.descripcion}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Equipo:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {submission.team.nombre}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Desafío:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {submission.challenge.titulo}
                            </span>
                          </div>
                          {submission.submittedAt && (
                            <div>
                              <span className="text-gray-500">Enviada:</span>
                              <span className="ml-2 text-gray-900">
                                {format(
                                  new Date(submission.submittedAt),
                                  'dd/MM/yyyy HH:mm',
                                  { locale: es }
                                )}
                              </span>
                            </div>
                          )}
                          {submission.puntajeFinal !== undefined &&
                            submission.puntajeFinal !== null && (
                              <div>
                                <span className="text-gray-500">Calificación:</span>
                                <span className="ml-2 font-bold text-purple-600">
                                  {submission.puntajeFinal}/100
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {submission.urlArchivo && (
                        <a
                          href={submission.urlArchivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <FileText className="h-4 w-4" />
                          Ver Archivo
                        </a>
                      )}
                      <Link
                        href={`/juez/entrega/${submission.id}/evaluar`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <Award className="h-4 w-4" />
                        {submission.status === 'EVALUATED' ? 'Ver Evaluación' : 'Evaluar'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
