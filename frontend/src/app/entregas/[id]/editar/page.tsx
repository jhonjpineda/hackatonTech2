'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SubmissionForm } from '@/components/submissions';
import { submissionService } from '@/services/submission.service';
import { Submission, SubmissionStatus, UpdateSubmissionDto } from '@/types/submission';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditSubmissionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

      // Verificar que esté en estado DRAFT
      if (data.status !== SubmissionStatus.DRAFT) {
        toast.error('Solo puedes editar entregas en estado borrador');
        router.push(`/entregas/${id}`);
        return;
      }

      setSubmission(data);
    } catch (error: any) {
      console.error('Error al cargar entrega:', error);
      toast.error(error.message || 'Error al cargar la entrega');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateSubmissionDto) => {
    if (!token || !submission) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      setSubmitting(true);
      await submissionService.update(submission.id, data, token);
      toast.success('Entrega actualizada exitosamente');
      router.push(`/entregas/${submission.id}`);
    } catch (error: any) {
      console.error('Error al actualizar entrega:', error);
      toast.error(error.message || 'Error al actualizar la entrega');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/entregas/${id}`);
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/entregas/${submission.id}`}
            className="inline-flex items-center text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al detalle
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Editar Entrega
          </h1>

          <div className="mt-4 space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Equipo:</span> {submission.team?.nombre || 'N/A'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Reto:</span> {submission.challenge?.titulo || 'N/A'}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <SubmissionForm
          initialData={submission}
          teamId={submission.teamId}
          challengeId={submission.challengeId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={submitting}
        />

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Aviso importante
          </h3>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
            <li>Solo puedes editar entregas en estado <strong>borrador</strong></li>
            <li>Una vez que envíes la entrega, no podrás modificarla</li>
            <li>Asegúrate de que toda la información esté correcta antes de enviar</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
