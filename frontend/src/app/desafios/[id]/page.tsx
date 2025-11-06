'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { challengeService } from '@/services/challenge.service';
import { Challenge, ChallengeDifficulty, ChallengeStatus } from '@/types/challenge';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Code2,
  Trophy,
  Calendar,
  Award,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Link as LinkIcon,
  Target,
  Clock,
  Tag,
  Upload,
  Medal,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChallengeDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (id) {
      loadChallenge();
    }
  }, [id]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const data = await challengeService.getById(id);
      setChallenge(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el desafío');
      router.push('/desafios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !challenge) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este desafío? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await challengeService.delete(challenge.id, token);
      toast.success('Desafío eliminado exitosamente');
      router.push('/desafios');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el desafío');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!token || !challenge) return;

    try {
      setPublishing(true);
      if (challenge.estado === ChallengeStatus.PUBLISHED) {
        const updated = await challengeService.close(challenge.id, token);
        setChallenge(updated);
        toast.success('Desafío cerrado');
      } else {
        const updated = await challengeService.publish(challenge.id, token);
        setChallenge(updated);
        toast.success('Desafío publicado');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar el estado');
    } finally {
      setPublishing(false);
    }
  };

  const getDifficultyColor = (difficulty: ChallengeDifficulty) => {
    const colors = {
      [ChallengeDifficulty.FACIL]: 'bg-green-100 text-green-800 border-green-300',
      [ChallengeDifficulty.MEDIO]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [ChallengeDifficulty.DIFICIL]: 'bg-orange-100 text-orange-800 border-orange-300',
      [ChallengeDifficulty.EXPERTO]: 'bg-red-100 text-red-800 border-red-300',
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

  const isOrganizador = user?.role === 'ORGANIZADOR';
  const isJuez = user?.role === 'JUEZ';
  const canSubmitSolution =
    user?.role === 'CAMPISTA' &&
    challenge?.estado === ChallengeStatus.PUBLISHED;
  const canReviewSubmissions = isOrganizador || isJuez;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando desafío...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!challenge) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Desafío no encontrado
          </h2>
          <Link
            href="/desafios"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Desafíos
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(challenge.estado);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/desafios"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Desafíos
          </Link>

          {isOrganizador && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePublish}
                disabled={publishing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  challenge.estado === ChallengeStatus.PUBLISHED
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
              >
                {publishing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : challenge.estado === ChallengeStatus.PUBLISHED ? (
                  <>
                    <EyeOff className="h-5 w-5" />
                    Cerrar
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Publicar
                  </>
                )}
              </button>

              <Link
                href={`/desafios/${challenge.id}/editar`}
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

        {/* Header del desafío */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-8 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Code2 className="h-10 w-10" />
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
                  >
                    {statusBadge.text}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-2 ${getDifficultyColor(
                      challenge.dificultad
                    )}`}
                  >
                    {getDifficultyText(challenge.dificultad)}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-3">{challenge.titulo}</h1>

              {/* Categoría y Topic */}
              {challenge.category && (
                <div className="flex items-center gap-2 text-blue-100">
                  <Tag className="h-4 w-4" />
                  <span>
                    {challenge.category.nombre}
                    {challenge.category.topic && ` • ${challenge.category.topic.nombre}`}
                  </span>
                </div>
              )}
            </div>
            {challenge.puntos && (
              <div className="text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <Trophy className="h-8 w-8 mx-auto mb-2" />
                <p className="text-2xl font-bold">{challenge.puntos}</p>
                <p className="text-sm">puntos</p>
              </div>
            )}
          </div>
        </div>

        {/* Información clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dificultad */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dificultad</p>
                <p className="font-medium text-gray-900">
                  {getDifficultyText(challenge.dificultad)}
                </p>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium text-gray-900">{statusBadge.text}</p>
              </div>
            </div>
          </div>

          {/* Fecha Límite */}
          {challenge.fechaLimite && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Límite</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(challenge.fechaLimite), "dd MMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección de entregas y clasificación */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Botón para revisar entregas (Jueces y Organizadores) */}
          {canReviewSubmissions && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Revisar Entregas</h3>
                    <p className="text-sm text-gray-600">
                      Ver y evaluar todas las entregas de los equipos
                    </p>
                  </div>
                </div>
                <Link
                  href={`/desafios/${challenge.id}/entregas`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FileText className="h-5 w-5" />
                  Ver Entregas
                </Link>
              </div>
            </div>
          )}

          {/* Botón para ver leaderboard */}
          <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6 ${
            canReviewSubmissions ? '' : 'lg:col-span-2'
          }`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500 rounded-lg">
                  <Medal className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tabla de Clasificación</h3>
                  <p className="text-sm text-gray-600">
                    Ve el ranking de los equipos y sus puntuaciones
                  </p>
                </div>
              </div>
              <Link
                href={`/desafios/${challenge.id}/leaderboard`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                <Trophy className="h-5 w-5" />
                Ver Ranking
              </Link>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Descripción del Desafío
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {challenge.descripcion}
          </p>
        </div>

        {/* Criterios de Evaluación */}
        {challenge.criteriosEvaluacion && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Criterios de Evaluación
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {challenge.criteriosEvaluacion}
            </p>
          </div>
        )}

        {/* Entregables */}
        {challenge.entregables && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-green-600" />
              Entregables Requeridos
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {challenge.entregables}
            </p>
          </div>
        )}

        {/* Recursos */}
        {challenge.recursos && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-purple-600" />
              Recursos y Enlaces de Ayuda
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {challenge.recursos}
            </p>
          </div>
        )}

        {/* PDF del Desafío */}
        {challenge.urlPdf && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-red-600" />
              Documento del Desafío
            </h2>
            <a
              href={challenge.urlPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Descargar PDF
            </a>
          </div>
        )}

        {/* Botón de envío de solución para campistas */}
        {canSubmitSolution && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¿Listo para resolver este desafío?
            </h3>
            <p className="text-gray-600 mb-4">
              Sube tu solución en formato PDF con toda la documentación requerida
            </p>
            <Link
              href={`/desafios/${challenge.id}/nueva-entrega`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Upload className="h-5 w-5" />
              Enviar Solución
            </Link>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información Adicional
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500 mb-1">Fecha de creación</dt>
              <dd className="text-gray-900">
                {format(new Date(challenge.createdAt), "d 'de' MMMM yyyy", {
                  locale: es,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-1">
                Última actualización
              </dt>
              <dd className="text-gray-900">
                {format(new Date(challenge.updatedAt), "d 'de' MMMM yyyy", {
                  locale: es,
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </DashboardLayout>
  );
}
