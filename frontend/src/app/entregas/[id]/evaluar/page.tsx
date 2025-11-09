'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { submissionService } from '@/services/submission.service';
import { evaluationService } from '@/services/evaluation.service';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import { Submission } from '@/types/submission';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, FileText, Users, Trophy } from 'lucide-react';

interface Rubric {
  id: string;
  nombre: string;
  descripcion?: string;
  escalaMinima: number;
  escalaMaxima: number;
  porcentaje: number;
  challengeId: string;
}

export default function EvaluateSubmissionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [evaluatedRubrics, setEvaluatedRubrics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentRubricIndex, setCurrentRubricIndex] = useState(0);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (user.role !== 'JUEZ') {
      toast.error('Solo los jueces pueden evaluar entregas');
      router.push('/dashboard');
      return;
    }

    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId, user, token, router]);

  const loadSubmission = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await submissionService.getById(submissionId, token);
      setSubmission(data);

      // Cargar las rúbricas del reto
      if (data.challenge?.id) {
        // Asumiendo que las rúbricas vienen con el challenge
        const challengeRubrics = data.challenge.rubrics || [];
        setRubrics(challengeRubrics);

        // Verificar cuáles rúbricas ya fueron evaluadas
        const existingEvaluations = await evaluationService.getBySubmission(
          submissionId,
          token
        );
        const evaluated = new Set(existingEvaluations.map((e) => e.rubricId));
        setEvaluatedRubrics(evaluated);
      }
    } catch (error: any) {
      console.error('Error al cargar entrega:', error);
      toast.error(error.message || 'Error al cargar la entrega');
      router.push('/entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationSuccess = () => {
    // Marcar rúbrica actual como evaluada
    const currentRubric = rubrics[currentRubricIndex];
    setEvaluatedRubrics((prev) => new Set([...prev, currentRubric.id]));

    // Si hay más rúbricas, pasar a la siguiente
    if (currentRubricIndex < rubrics.length - 1) {
      setCurrentRubricIndex(currentRubricIndex + 1);
      toast.success('Evaluación guardada. Continúa con la siguiente rúbrica');
    } else {
      // Si era la última, mostrar mensaje de completado
      toast.success('¡Todas las rúbricas han sido evaluadas!');
      router.push(`/entregas/${submissionId}`);
    }
  };

  const handleCancel = () => {
    router.push(`/entregas/${submissionId}`);
  };

  const goToRubric = (index: number) => {
    setCurrentRubricIndex(index);
  };

  if (loading || !submission || !token) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-200 text-lg">Cargando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (rubrics.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
            <Award className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No hay rúbricas de evaluación
            </h2>
            <p className="text-gray-300 mb-4">
              Este reto no tiene rúbricas definidas para evaluar.
            </p>
            <Link
              href={`/entregas/${submissionId}`}
              className="inline-block px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/80 transition-colors"
            >
              Volver a la Entrega
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentRubric = rubrics[currentRubricIndex];
  const allEvaluated = rubrics.every((r) => evaluatedRubrics.has(r.id));
  const progress = ((evaluatedRubrics.size / rubrics.length) * 100).toFixed(0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Link
            href={`/entregas/${submissionId}`}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-brand-cyan mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la Entrega
          </Link>

          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Award className="h-8 w-8 text-brand-purple" />
            Evaluar Entrega
          </h1>
        </div>

        {/* Submission Info Card */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <FileText className="h-4 w-4" />
                Entrega
              </div>
              <p className="text-white font-semibold">{submission.titulo}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Users className="h-4 w-4" />
                Equipo
              </div>
              <p className="text-white font-semibold">{submission.team?.nombre || 'N/A'}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Trophy className="h-4 w-4" />
                Reto
              </div>
              <p className="text-white font-semibold">{submission.challenge?.titulo || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">
              Progreso de Evaluación
            </h2>
            <span className="text-brand-cyan font-semibold">
              {evaluatedRubrics.size} / {rubrics.length} rúbricas
            </span>
          </div>
          <div className="w-full bg-brand-dark rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-purple h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rubrics Navigation */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Rúbricas de Evaluación:</h3>
          <div className="flex flex-wrap gap-2">
            {rubrics.map((rubric, index) => {
              const isEvaluated = evaluatedRubrics.has(rubric.id);
              const isCurrent = index === currentRubricIndex;

              return (
                <button
                  key={rubric.id}
                  onClick={() => goToRubric(index)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-brand-purple text-white border-brand-purple'
                      : isEvaluated
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-brand-dark text-gray-300 border-brand-purple/30 hover:border-brand-purple/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isEvaluated && <span className="text-xs">✓</span>}
                    <span className="text-sm font-medium">{rubric.nombre}</span>
                    <span className="text-xs opacity-70">({rubric.porcentaje}%)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evaluation Form */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">
              Rúbrica {currentRubricIndex + 1} de {rubrics.length}
            </h2>
            {evaluatedRubrics.has(currentRubric.id) && (
              <p className="text-sm text-green-300 mt-1">
                ✓ Esta rúbrica ya fue evaluada. Puedes actualizarla si lo deseas.
              </p>
            )}
          </div>

          <EvaluationForm
            rubric={{
              ...currentRubric,
              escalaMinima: currentRubric.escalaMinima || 0,
              escalaMaxima: currentRubric.escalaMaxima || 100,
            }}
            teamId={submission.teamId}
            submissionId={submissionId}
            token={token}
            onSuccess={handleEvaluationSuccess}
            onCancel={handleCancel}
          />
        </div>

        {/* Completion Message */}
        {allEvaluated && (
          <div className="bg-green-500/10 border-l-4 border-green-500 p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-green-300 mb-2 flex items-center gap-2">
              <Award className="h-5 w-5" />
              ¡Evaluación Completada!
            </h3>
            <p className="text-gray-300">
              Has evaluado todas las rúbricas de esta entrega. Puedes modificar cualquier
              evaluación seleccionando la rúbrica correspondiente arriba.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
