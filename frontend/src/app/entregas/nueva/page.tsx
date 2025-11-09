'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubmissionForm } from '@/components/submissions';
import { submissionService } from '@/services/submission.service';
import { teamService } from '@/services/team.service';
import { challengeService } from '@/services/challenge.service';
import { CreateSubmissionDto, UpdateSubmissionDto } from '@/types/submission';
import { Team } from '@/types/team';
import { Challenge } from '@/types/challenge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function NewSubmissionPageContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const teamId = searchParams?.get('teamId') || '';
  const challengeId = searchParams?.get('challengeId') || '';

  const [team, setTeam] = useState<Team | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!teamId || !challengeId) {
      toast.error('Faltan parámetros requeridos (teamId y challengeId)');
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [user, teamId, challengeId, token]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [teamData, challengeData] = await Promise.all([
        teamService.getById(teamId, token),
        challengeService.getById(challengeId),
      ]);
      setTeam(teamData);
      setChallenge(challengeData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar los datos');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateSubmissionDto | UpdateSubmissionDto) => {
    if (!token) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      setSubmitting(true);
      const submission = await submissionService.create(data as CreateSubmissionDto, token);
      toast.success('Entrega creada exitosamente como borrador');
      router.push(`/entregas/${submission.id}`);
    } catch (error: any) {
      console.error('Error al crear entrega:', error);
      toast.error(error.message || 'Error al crear la entrega');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!team || !challenge) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500">No se encontraron los datos necesarios</p>
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-[#00ffff] hover:text-[#b64cff] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>

          <h1 className="text-3xl font-bold text-white">
            Nueva Entrega
          </h1>

          <div className="mt-4 space-y-2">
            <p className="text-gray-200">
              <span className="font-semibold text-[#00ffff]">Equipo:</span> {team.nombre}
            </p>
            <p className="text-gray-200">
              <span className="font-semibold text-[#00ffff]">Reto:</span> {challenge.titulo}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <SubmissionForm
          teamId={teamId}
          challengeId={challengeId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Información importante
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Tu entrega se guardará como <strong>borrador</strong> inicialmente</li>
            <li>Podrás editarla hasta que la envíes oficialmente</li>
            <li>Una vez enviada, no podrás modificarla</li>
            <li>Debes proporcionar al menos un enlace (repositorio, demo o video)</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewSubmissionPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          </div>
        </DashboardLayout>
      }
    >
      <NewSubmissionPageContent />
    </Suspense>
  );
}
