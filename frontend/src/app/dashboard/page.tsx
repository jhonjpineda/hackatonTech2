'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Trophy, Users, FolderGit2, TrendingUp, FileText, Award, Clock, CheckCircle } from 'lucide-react';
import { submissionService } from '@/services/submission.service';
import { Submission, SubmissionStatus } from '@/types/submission';
import { hackathonService } from '@/services/hackathonService';
import { teamService } from '@/services/team.service';
import { Hackathon } from '@/types/hackathon';
import { Team } from '@/types/team';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && token) {
      loadMySubmissions();
      loadDashboardData();
    }
  }, [user, token]);

  const loadMySubmissions = async () => {
    if (!token) return;

    try {
      setLoadingSubmissions(true);
      const data = await submissionService.getMySubmissions(token);
      setSubmissions(data);
    } catch (error) {
      console.error('Error al cargar entregas:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadDashboardData = async () => {
    if (!token) return;

    try {
      setLoadingStats(true);
      const [hackathonsData, teamsData] = await Promise.all([
        hackathonService.getPublic(),
        teamService.getAll(token),
      ]);
      setHackathons(hackathonsData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleName = (role: string) => {
    const roles: { [key: string]: string } = {
      CAMPISTA: 'Campista',
      JUEZ: 'Juez',
      ORGANIZADOR: 'Organizador',
    };
    return roles[role] || role;
  };

  // Calcular estadísticas de entregas
  const submissionsStats = {
    total: submissions.length,
    draft: submissions.filter(s => s.status === SubmissionStatus.DRAFT).length,
    submitted: submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length,
    evaluated: submissions.filter(s => s.status === SubmissionStatus.EVALUATED).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {user.nombres} {user.apellidos}!
          </h1>
          <p className="text-blue-100">
            Dashboard de {getRoleName(user.role)} · {user.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Hackathones Activos
              </CardTitle>
              <Trophy className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold text-gray-400">...</div>
              ) : (
                <div className="text-2xl font-bold">{hackathons.length}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {hackathons.length === 0 ? 'Sin hackathones disponibles' : 'Disponibles ahora'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Mis Equipos
              </CardTitle>
              <Users className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold text-gray-400">...</div>
              ) : (
                <div className="text-2xl font-bold">{teams.length}</div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {teams.length === 0 ? 'Sin equipos registrados' : teams.length === 1 ? 'Equipo activo' : 'Equipos activos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Mis Entregas
              </CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissionsStats.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {submissionsStats.draft} borradores · {submissionsStats.submitted} enviadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Evaluadas
              </CardTitle>
              <Award className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissionsStats.evaluated}</div>
              <p className="text-xs text-gray-500 mt-1">
                {submissionsStats.total > 0
                  ? `${Math.round((submissionsStats.evaluated / submissionsStats.total) * 100)}% completado`
                  : 'Sin entregas aún'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mis Entregas Recientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mis Entregas Recientes</CardTitle>
                  <CardDescription>Últimos proyectos enviados</CardDescription>
                </div>
                <Link
                  href="/entregas/nueva"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Nueva entrega
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando entregas...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No tienes entregas todavía</p>
                  <Link
                    href="/entregas/nueva"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Crear tu primera entrega
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((submission) => (
                    <Link
                      key={submission.id}
                      href={`/entregas/${submission.id}`}
                      className="flex items-center gap-3 p-3 rounded hover:bg-gray-50 border border-gray-200"
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        submission.status === SubmissionStatus.EVALUATED
                          ? 'bg-green-100'
                          : submission.status === SubmissionStatus.SUBMITTED
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {submission.status === SubmissionStatus.EVALUATED ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : submission.status === SubmissionStatus.SUBMITTED ? (
                          <FileText className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {submission.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {submission.challenge?.titulo || 'Sin desafío'} · {submission.team?.nombre || 'Sin equipo'}
                        </p>
                      </div>
                      {submission.puntajeFinal !== null && submission.puntajeFinal !== undefined && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{submission.puntajeFinal}</p>
                          <p className="text-xs text-gray-500">puntos</p>
                        </div>
                      )}
                    </Link>
                  ))}
                  {submissions.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        Mostrando 5 de {submissions.length} entregas
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Perfil</CardTitle>
              <CardDescription>Tus datos personales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{user.documento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rol</p>
                  <p className="font-medium">{getRoleName(user.role)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Tus últimas acciones</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubmissions || loadingStats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando actividad...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Últimas entregas */}
                  {submissions.slice(0, 2).map((submission) => (
                    <Link
                      key={`activity-submission-${submission.id}`}
                      href={`/entregas/${submission.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <FolderGit2 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {submission.status === SubmissionStatus.SUBMITTED
                            ? 'Enviaste una entrega'
                            : submission.status === SubmissionStatus.EVALUATED
                            ? 'Entrega evaluada'
                            : 'Creaste un borrador'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {submission.challenge?.titulo || 'Desafío'}
                        </p>
                      </div>
                    </Link>
                  ))}

                  {/* Equipos */}
                  {teams.slice(0, 1).map((team) => (
                    <Link
                      key={`activity-team-${team.id}`}
                      href={`/equipos/${team.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Equipo "{team.nombre}"
                        </p>
                        <p className="text-xs text-gray-500">
                          {team.members?.length || 0} miembros
                        </p>
                      </div>
                    </Link>
                  ))}

                  {/* Hackathones */}
                  {hackathons.slice(0, 1).map((hackathon) => (
                    <Link
                      key={`activity-hackathon-${hackathon.id}`}
                      href={`/hackathones/${hackathon.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Hackathon disponible
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {hackathon.nombre}
                        </p>
                      </div>
                    </Link>
                  ))}

                  {/* Estado vacío */}
                  {submissions.length === 0 && teams.length === 0 && hackathons.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No hay actividad reciente</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Comienza participando en hackathones
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
