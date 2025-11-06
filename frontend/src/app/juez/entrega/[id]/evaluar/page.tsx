'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import { submissionService } from '@/services/submission.service';
import { rubricService, Rubric } from '@/services/rubric.service';
import { evaluationService, Evaluation } from '@/services/evaluation.service';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, Award, Save, Eye } from 'lucide-react';

interface Submission {
  id: string;
  titulo: string;
  descripcion: string;
  urlArchivo?: string;
  status: string;
  team: {
    id: string;
    nombre: string;
  };
  challenge: {
    id: string;
    titulo: string;
  };
}

export default function EvaluarEntregaPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [existingEvaluations, setExistingEvaluations] = useState<Evaluation[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, { calificacion: number; comentarios: string }>>({});

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
  }, [router, submissionId]);

  const loadData = async (authToken: string) => {
    try {
      setLoading(true);

      // Cargar submission
      const submissionData = await submissionService.getById(submissionId, authToken);
      setSubmission(submissionData);

      // Cargar rúbricas del desafío
      const rubricsData = await rubricService.getByChallenge(submissionData.challenge.id);
      setRubrics(rubricsData);

      // Cargar evaluaciones existentes
      const existingEvals = await evaluationService.getBySubmission(submissionId, authToken);
      setExistingEvaluations(existingEvals);

      // Pre-llenar formulario con evaluaciones existentes del juez actual
      const myEvaluations: Record<string, { calificacion: number; comentarios: string }> = {};
      existingEvals.forEach((evaluation) => {
        if (evaluation.juezId === user?.id) {
          myEvaluations[evaluation.rubricId] = {
            calificacion: evaluation.calificacion,
            comentarios: evaluation.comentarios || '',
          };
        }
      });
      setEvaluations(myEvaluations);

    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCalificacionChange = (rubricId: string, value: number) => {
    setEvaluations((prev) => ({
      ...prev,
      [rubricId]: {
        ...(prev[rubricId] || { comentarios: '' }),
        calificacion: value,
      },
    }));
  };

  const handleComentariosChange = (rubricId: string, value: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [rubricId]: {
        ...(prev[rubricId] || { calificacion: 0 }),
        comentarios: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !submission) {
      toast.error('Error: datos no disponibles');
      return;
    }

    // Validar que todas las rúbricas tengan calificación
    const missingRubrics = rubrics.filter(
      (rubric) =>
        !evaluations[rubric.id] || evaluations[rubric.id].calificacion === undefined
    );

    if (missingRubrics.length > 0) {
      toast.error(`Debes calificar todas las rúbricas`);
      return;
    }

    try {
      setSaving(true);

      // Crear/actualizar evaluaciones para cada rúbrica
      for (const rubric of rubrics) {
        const evaluation = evaluations[rubric.id];
        if (!evaluation) continue;

        const existingEval = existingEvaluations.find(
          (e) => e.rubricId === rubric.id && e.juezId === user?.id
        );

        if (existingEval) {
          // Actualizar evaluación existente
          await evaluationService.update(
            existingEval.id,
            {
              calificacion: evaluation.calificacion,
              comentarios: evaluation.comentarios || undefined,
            },
            token
          );
        } else {
          // Crear nueva evaluación
          await evaluationService.create(
            {
              rubricId: rubric.id,
              teamId: submission.team.id,
              submissionId: submission.id,
              calificacion: evaluation.calificacion,
              comentarios: evaluation.comentarios || undefined,
            },
            token
          );
        }
      }

      toast.success('Evaluación guardada exitosamente');

      // Redirigir de vuelta
      const challengeId = submission.challenge.id;
      const hackathonResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (hackathonResponse.ok) {
        const categories = await hackathonResponse.json();
        // Buscar la categoría del equipo para obtener el hackathonId
        const teamResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/teams/${submission.team.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const category = categories.find((c: any) => c.id === teamData.categoryId);
          if (category) {
            router.push(`/juez/hackathon/${category.hackathonId}`);
            return;
          }
        }
      }

      // Fallback: ir al dashboard del juez
      router.push('/juez');

    } catch (error: any) {
      console.error('Error al guardar evaluación:', error);
      toast.error(error.message || 'Error al guardar evaluación');
    } finally {
      setSaving(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando entrega...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Entrega no encontrada</div>
      </div>
    );
  }

  const isAlreadyEvaluated = rubrics.every((rubric) =>
    existingEvaluations.some((e) => e.rubricId === rubric.id && e.juezId === user.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/juez"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Asignaciones
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluar Entrega
          </h1>
          <p className="text-gray-600">
            {isAlreadyEvaluated ? 'Editar evaluación' : 'Nueva evaluación'}
          </p>
        </div>

        {/* Información de la Entrega */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información de la Entrega
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Título:</span>
              <p className="text-gray-900">{submission.titulo}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Equipo:</span>
              <p className="text-gray-900">{submission.team.nombre}</p>
            </div>

            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-500">Descripción:</span>
              <p className="text-gray-900">{submission.descripcion}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Desafío:</span>
              <p className="text-gray-900">{submission.challenge.titulo}</p>
            </div>

            {submission.urlArchivo && (
              <div>
                <a
                  href={submission.urlArchivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                  Ver Archivo PDF
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Evaluación */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Rúbricas de Evaluación
              </h2>
            </div>

            {rubrics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay rúbricas definidas para este desafío
              </div>
            ) : (
              <div className="space-y-6">
                {rubrics.map((rubric) => (
                  <div
                    key={rubric.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {rubric.nombre}
                        </h3>
                        <span className="text-sm font-medium text-purple-600">
                          {rubric.porcentaje}% del total
                        </span>
                      </div>
                      {rubric.descripcion && (
                        <p className="text-sm text-gray-600">{rubric.descripcion}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Escala: {rubric.escalaMinima} - {rubric.escalaMaxima}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`calificacion-${rubric.id}`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Calificación *
                        </label>
                        <input
                          type="number"
                          id={`calificacion-${rubric.id}`}
                          min={rubric.escalaMinima}
                          max={rubric.escalaMaxima}
                          step="0.1"
                          value={evaluations[rubric.id]?.calificacion || ''}
                          onChange={(e) =>
                            handleCalificacionChange(rubric.id, parseFloat(e.target.value))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`comentarios-${rubric.id}`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Comentarios (opcional)
                        </label>
                        <textarea
                          id={`comentarios-${rubric.id}`}
                          rows={3}
                          value={evaluations[rubric.id]?.comentarios || ''}
                          onChange={(e) =>
                            handleComentariosChange(rubric.id, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Retroalimentación constructiva para el equipo..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {rubrics.length > 0 && (
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Guardando...' : isAlreadyEvaluated ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>

        {/* Nota Informativa */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Tu evaluación se guardará y podrá ser editada posteriormente.
            El equipo no verá las calificaciones hasta que todas las evaluaciones estén completas.
          </p>
        </div>
      </div>
    </div>
  );
}
