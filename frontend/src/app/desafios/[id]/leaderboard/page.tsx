'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { submissionService } from '@/services/submission.service';
import { challengeService } from '@/services/challenge.service';
import { LeaderboardEntry } from '@/types/submission';
import { Challenge } from '@/types/challenge';
import { ArrowLeft, Trophy, Medal, Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LeaderboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const challengeId = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
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
      const [challengeData, leaderboardData] = await Promise.all([
        challengeService.getById(challengeId),
        submissionService.getLeaderboard(challengeId, token),
      ]);
      setChallenge(challengeData);
      setLeaderboard(leaderboardData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <span className="text-2xl font-bold text-yellow-600">1°</span>
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="flex items-center gap-2">
          <Medal className="h-7 w-7 text-gray-400" />
          <span className="text-xl font-bold text-gray-500">2°</span>
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="flex items-center gap-2">
          <Award className="h-6 w-6 text-orange-600" />
          <span className="text-lg font-bold text-orange-600">3°</span>
        </div>
      );
    } else {
      return <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{position}°</span>;
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (position === 2) return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    if (position === 3) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tabla de posiciones...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!challenge) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500">Desafío no encontrado</p>
            <Link
              href="/desafios"
              className="mt-4 inline-flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Desafíos
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/desafios/${challengeId}`}
            className="inline-flex items-center text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al desafío
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Tabla de Posiciones
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {challenge.titulo}
            </p>
          </div>
        </div>

        {/* Tabla de Posiciones */}
        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aún no hay entregas evaluadas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                La tabla de posiciones se actualizará cuando haya entregas evaluadas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.submission.id}
                className={`border rounded-lg p-6 transition-all hover:shadow-lg ${getPositionColor(entry.position)}`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Posición */}
                  <div className="flex-shrink-0 w-20">
                    {getPositionBadge(entry.position)}
                  </div>

                  {/* Información del equipo y proyecto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {entry.team.nombre}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                      {entry.submission.titulo}
                    </p>

                    {/* Enlaces */}
                    <div className="flex flex-wrap gap-2 text-sm">
                      {entry.submission.repositorioUrl && (
                        <a
                          href={entry.submission.repositorioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          📁 Repositorio
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {entry.submission.demoUrl && (
                        <a
                          href={entry.submission.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          🌐 Demo
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {entry.submission.videoUrl && (
                        <a
                          href={entry.submission.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          🎥 Video
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Link
                        href={`/entregas/${entry.submission.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Ver detalle completo
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Puntaje */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {entry.puntajeFinal.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      / 100 pts
                    </div>
                  </div>
                </div>

                {/* Tecnologías */}
                {entry.submission.tecnologiasArray && entry.submission.tecnologiasArray.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {entry.submission.tecnologiasArray.slice(0, 8).map((tech: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                      {entry.submission.tecnologiasArray.length > 8 && (
                        <Badge variant="outline">
                          +{entry.submission.tecnologiasArray.length - 8} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        {leaderboard.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {leaderboard.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Puntaje Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(
                    leaderboard.reduce((sum, entry) => sum + entry.puntajeFinal, 0) /
                    leaderboard.length
                  ).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Puntaje Más Alto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {leaderboard[0]?.puntajeFinal.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
