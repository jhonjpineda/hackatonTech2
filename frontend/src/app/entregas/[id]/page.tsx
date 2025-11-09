'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/submissions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { submissionService } from '@/services/submission.service';
import { evaluationService, Evaluation } from '@/services/evaluation.service';
import { EvaluationsList } from '@/components/evaluations/EvaluationsList';
import { Submission, SubmissionStatus } from '@/types/submission';
import { ArrowLeft, Edit, Trash2, Send, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SubmissionDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (id && token) {
      loadSubmission();
    }
  }, [id, token, user]);

  const loadSubmission = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await submissionService.getById(id, token);
      setSubmission(data);

      // Cargar evaluaciones de esta entrega
      loadEvaluations();
    } catch (error: any) {
      console.error('Error al cargar entrega:', error);
      toast.error(error.message || 'Error al cargar la entrega');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async () => {
    if (!token) return;

    try {
      setLoadingEvaluations(true);
      const data = await evaluationService.getBySubmission(id, token);
      setEvaluations(data);
    } catch (error: any) {
      console.error('Error al cargar evaluaciones:', error);
      // No mostramos toast error aquí, solo en consola
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !submission) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas enviar esta entrega? Una vez enviada, no podrás modificarla.'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await submissionService.submit(submission.id, token);
      toast.success('Entrega enviada exitosamente');
      loadSubmission(); // Recargar para ver el nuevo estado
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la entrega');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !submission) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar esta entrega? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await submissionService.delete(submission.id, token);
      toast.success('Entrega eliminada exitosamente');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la entrega');
      setActionLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando entrega...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!submission) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500">Entrega no encontrada</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = submission.status === SubmissionStatus.DRAFT;
  const canSubmit = submission.status === SubmissionStatus.DRAFT;
  const canDelete = submission.status === SubmissionStatus.DRAFT;
  const canEvaluate = user?.role === 'JUEZ' && submission.status !== SubmissionStatus.DRAFT;
  const tecnologias = submission.tecnologiasArray || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {submission.titulo}
              </h1>
              <StatusBadge status={submission.status} />
            </div>

            <div className="flex gap-2">
              {canEvaluate && (
                <Link href={`/entregas/${submission.id}/evaluar`}>
                  <Button variant="default" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Evaluar
                  </Button>
                </Link>
              )}
              {canEdit && (
                <Link href={`/entregas/${submission.id}/editar`}>
                  <Button variant="outline" size="sm" disabled={actionLoading}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              )}
              {canSubmit && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={actionLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Entrega
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {submission.descripcion}
                </p>
              </CardContent>
            </Card>

            {/* Enlaces */}
            <Card>
              <CardHeader>
                <CardTitle>Enlaces del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.repositorioUrl && (
                  <a
                    href={submission.repositorioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-2xl">📁</span>
                    <div className="flex-1">
                      <p className="font-semibold">Repositorio de Código</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                        {submission.repositorioUrl}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {submission.demoUrl && (
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-2xl">🌐</span>
                    <div className="flex-1">
                      <p className="font-semibold">Demostración en Vivo</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                        {submission.demoUrl}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {submission.videoUrl && (
                  <a
                    href={submission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-2xl">🎥</span>
                    <div className="flex-1">
                      <p className="font-semibold">Video de Presentación</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                        {submission.videoUrl}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {submission.documentacionUrl && (
                  <a
                    href={submission.documentacionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <span className="text-2xl">📄</span>
                    <div className="flex-1">
                      <p className="font-semibold">Documentación Técnica</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                        {submission.documentacionUrl}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Comentarios */}
            {submission.comentarios && (
              <Card>
                <CardHeader>
                  <CardTitle>Comentarios Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {submission.comentarios}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Información general */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {submission.team && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Equipo</p>
                    <p className="font-semibold">{submission.team.nombre}</p>
                  </div>
                )}

                {submission.challenge && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Reto</p>
                    <p className="font-semibold">{submission.challenge.titulo}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-500 dark:text-gray-400">Creada</p>
                  <p className="font-semibold">{formatDate(submission.createdAt)}</p>
                </div>

                {submission.submittedAt && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Enviada</p>
                    <p className="font-semibold">{formatDate(submission.submittedAt)}</p>
                  </div>
                )}

                {submission.puntajeFinal && (
                  <div className="pt-3 border-t">
                    <p className="text-gray-500 dark:text-gray-400">Puntaje Final</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Number(submission.puntajeFinal).toFixed(2)} / 100
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tecnologías */}
            {tecnologias.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tecnologías</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tecnologias.map((tech: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Evaluaciones Section */}
        {submission.status !== SubmissionStatus.DRAFT && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Evaluaciones Recibidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEvaluations ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">Cargando evaluaciones...</div>
                  </div>
                ) : (
                  <EvaluationsList evaluations={evaluations} showJudgeName={true} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
