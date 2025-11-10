'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { submissionService } from '@/services/submission.service';
import { Submission } from '@/types/submission';
import { FolderGit2, Search, Filter, Calendar, Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EntregasPage() {
  const { user, token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      loadSubmissions();
    }
  }, [token]);

  const loadSubmissions = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await submissionService.getAll(token);
      setSubmissions(data);
    } catch (error: any) {
      console.error('Error al cargar entregas:', error);
      toast.error(error.message || 'Error al cargar las entregas');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      submission.team?.nombre.toLowerCase().includes(searchLower) ||
      submission.challenge?.titulo.toLowerCase().includes(searchLower) ||
      submission.descripcion?.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar por estado
  const pendingSubmissions = filteredSubmissions.filter(s => !s.calificada);
  const gradedSubmissions = filteredSubmissions.filter(s => s.calificada);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando entregas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Entregas</h1>
            <p className="mt-1 text-gray-300">
              {user?.role === 'ORGANIZADOR'
                ? 'Revisa todas las entregas del sistema'
                : user?.role === 'JUEZ'
                ? 'Revisa las entregas asignadas para evaluar'
                : 'Entregas de tus equipos en los diferentes desafíos'}
            </p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por equipo, desafío o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Entregas Pendientes de Calificar */}
        {user?.role === 'JUEZ' && pendingSubmissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-yellow-500" />
              Pendientes de Evaluar ({pendingSubmissions.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          </div>
        )}

        {/* Entregas Calificadas */}
        {gradedSubmissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-green-500" />
              {user?.role === 'JUEZ' ? 'Evaluadas' : 'Entregas'} ({gradedSubmissions.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gradedSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          </div>
        )}

        {/* Todas las entregas (para organizadores y campistas) */}
        {user?.role !== 'JUEZ' && filteredSubmissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-blue-500" />
              Todas las Entregas ({filteredSubmissions.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FolderGit2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No hay entregas disponibles
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'No se encontraron entregas con ese criterio'
                : user?.role === 'ORGANIZADOR'
                ? 'Aún no se han realizado entregas en el sistema'
                : user?.role === 'JUEZ'
                ? 'No tienes entregas asignadas para evaluar'
                : 'Tu equipo aún no ha realizado entregas'}
            </p>
          </div>
        )}

        {/* Contador */}
        {filteredSubmissions.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Mostrando {filteredSubmissions.length} de {submissions.length} entregas
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Componente de tarjeta de entrega
interface SubmissionCardProps {
  submission: Submission;
}

function SubmissionCard({ submission }: SubmissionCardProps) {
  return (
    <Link href={`/entregas/${submission.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4">
          <div className="flex items-start justify-between mb-2">
            <FolderGit2 className="h-8 w-8 text-white" />
            {submission.calificada && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Calificada
              </span>
            )}
            {!submission.calificada && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pendiente
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors">
            {submission.team?.nombre || 'Equipo sin nombre'}
          </h3>
        </div>

        {/* Contenido */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Desafío */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Desafío</p>
            <p className="text-sm font-medium text-gray-700">
              {submission.challenge?.titulo || 'Sin desafío'}
            </p>
          </div>

          {/* Descripción */}
          {submission.descripcion && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
              {submission.descripcion}
            </p>
          )}

          {/* Información adicional */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            {/* Fecha de entrega */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(submission.fechaEntrega), 'dd MMM yyyy HH:mm', {
                  locale: es,
                })}
              </span>
            </div>

            {/* Puntuación */}
            {submission.calificada && submission.puntuacion !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-gray-700">
                  {submission.puntuacion.toFixed(2)} puntos
                </span>
              </div>
            )}

            {/* Enlaces */}
            {(submission.urlRepositorio || submission.urlDemo) && (
              <div className="flex items-center gap-2 text-sm pt-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600">
                  {submission.urlRepositorio && submission.urlDemo
                    ? 'Repo + Demo'
                    : submission.urlRepositorio
                    ? 'Repositorio'
                    : 'Demo'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
