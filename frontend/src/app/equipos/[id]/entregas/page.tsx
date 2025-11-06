'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubmissionCard } from '@/components/submissions';
import { submissionService } from '@/services/submission.service';
import { teamService } from '@/services/team.service';
import { Submission, SubmissionStatus } from '@/types/submission';
import { Team } from '@/types/team';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TeamSubmissionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (teamId && token) {
      loadData();
    }
  }, [teamId, token, user]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [teamData, submissionsData] = await Promise.all([
        teamService.getById(teamId, token),
        submissionService.getByTeam(teamId, token),
      ]);
      setTeam(teamData);
      setSubmissions(submissionsData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: string) => {
    router.push(`/entregas/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/entregas/${id}/editar`);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar esta entrega? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      await submissionService.delete(id, token);
      toast.success('Entrega eliminada exitosamente');
      loadData(); // Recargar la lista
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la entrega');
    }
  };

  const handleSubmit = async (id: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas enviar esta entrega? Una vez enviada, no podrás modificarla.'
    );

    if (!confirmed) return;

    try {
      await submissionService.submit(id, token);
      toast.success('Entrega enviada exitosamente');
      loadData(); // Recargar para ver el nuevo estado
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la entrega');
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    if (filterStatus === 'ALL') return true;
    return submission.status === filterStatus;
  });

  const getStatusCount = (status: SubmissionStatus | 'ALL') => {
    if (status === 'ALL') return submissions.length;
    return submissions.filter((s) => s.status === status).length;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando entregas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500">Equipo no encontrado</p>
            <Link
              href="/equipos"
              className="mt-4 inline-flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Equipos
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/equipos/${teamId}`}
            className="inline-flex items-center text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al equipo
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Entregas del Equipo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {team.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
          >
            Todas ({getStatusCount('ALL')})
          </Button>
          <Button
            variant={filterStatus === SubmissionStatus.DRAFT ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(SubmissionStatus.DRAFT)}
          >
            Borradores ({getStatusCount(SubmissionStatus.DRAFT)})
          </Button>
          <Button
            variant={filterStatus === SubmissionStatus.SUBMITTED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(SubmissionStatus.SUBMITTED)}
          >
            Enviadas ({getStatusCount(SubmissionStatus.SUBMITTED)})
          </Button>
          <Button
            variant={filterStatus === SubmissionStatus.UNDER_REVIEW ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(SubmissionStatus.UNDER_REVIEW)}
          >
            En Revisión ({getStatusCount(SubmissionStatus.UNDER_REVIEW)})
          </Button>
          <Button
            variant={filterStatus === SubmissionStatus.EVALUATED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(SubmissionStatus.EVALUATED)}
          >
            Evaluadas ({getStatusCount(SubmissionStatus.EVALUATED)})
          </Button>
        </div>

        {/* Lista de entregas */}
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No hay entregas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filterStatus === 'ALL'
                ? 'Este equipo aún no ha creado ninguna entrega'
                : `No hay entregas con el estado seleccionado`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                showChallengeInfo={true}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
              />
            ))}
          </div>
        )}

        {/* Información del equipo */}
        {submissions.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📊 Estadísticas del Equipo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600 dark:text-blue-400">Total de entregas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {submissions.length}
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400">Borradores</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getStatusCount(SubmissionStatus.DRAFT)}
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400">Enviadas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getStatusCount(SubmissionStatus.SUBMITTED) +
                    getStatusCount(SubmissionStatus.UNDER_REVIEW)}
                </p>
              </div>
              <div>
                <p className="text-blue-600 dark:text-blue-400">Evaluadas</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getStatusCount(SubmissionStatus.EVALUATED)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
