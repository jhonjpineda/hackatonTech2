'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { evaluationService, Evaluation } from '@/services/evaluation.service';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import {
  Award,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Filter,
  Search
} from 'lucide-react';

export default function EvaluacionesPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && token) {
      loadEvaluations();
    }
  }, [user, token, loading, router]);

  const loadEvaluations = async () => {
    if (!token || !user) return;

    try {
      setLoadingEvaluations(true);

      let data: Evaluation[] = [];

      if (user.role === 'JUEZ') {
        // Jueces ven solo sus evaluaciones
        data = await evaluationService.getByJuez(user.id);
      } else if (user.role === 'ORGANIZADOR') {
        // Organizadores ven todas las evaluaciones
        data = await evaluationService.getAll(token);
      } else {
        // Campistas ven evaluaciones de sus equipos
        // Aquí necesitaríamos obtener los equipos del usuario primero
        // Por ahora mostramos un mensaje
        data = [];
      }

      setEvaluations(data);
    } catch (error: any) {
      console.error('Error al cargar evaluaciones:', error);
      toast.error(error.message || 'Error al cargar evaluaciones');
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (!filterText) return true;

    const searchText = filterText.toLowerCase();
    return (
      evaluation.rubric?.nombre?.toLowerCase().includes(searchText) ||
      evaluation.team?.nombre?.toLowerCase().includes(searchText) ||
      evaluation.juez?.nombres?.toLowerCase().includes(searchText) ||
      evaluation.juez?.apellidos?.toLowerCase().includes(searchText) ||
      evaluation.comentarios?.toLowerCase().includes(searchText)
    );
  });

  const calculateStats = () => {
    if (evaluations.length === 0) {
      return {
        total: 0,
        promedio: 0,
        maxima: 0,
        minima: 0,
      };
    }

    const calificaciones = evaluations.map(e => Number(e.calificacion));
    const suma = calificaciones.reduce((a, b) => a + b, 0);

    return {
      total: evaluations.length,
      promedio: (suma / evaluations.length).toFixed(2),
      maxima: Math.max(...calificaciones),
      minima: Math.min(...calificaciones),
    };
  };

  const stats = calculateStats();

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-200 text-lg">Cargando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Award className="h-8 w-8 text-brand-purple" />
                Evaluaciones
              </h1>
              <p className="mt-2 text-gray-300">
                {user.role === 'JUEZ' && 'Evaluaciones que has realizado a los equipos'}
                {user.role === 'ORGANIZADOR' && 'Todas las evaluaciones del sistema'}
                {user.role === 'CAMPISTA' && 'Evaluaciones recibidas en tus equipos'}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Evaluaciones</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-brand-purple" />
              </div>
            </div>

            <div className="bg-brand-navy rounded-lg border border-brand-cyan/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Promedio</p>
                  <p className="text-2xl font-bold text-white">{stats.promedio}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-brand-cyan" />
              </div>
            </div>

            <div className="bg-brand-navy rounded-lg border border-green-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Máxima</p>
                  <p className="text-2xl font-bold text-white">{stats.maxima || '-'}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-brand-navy rounded-lg border border-yellow-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Mínima</p>
                  <p className="text-2xl font-bold text-white">{stats.minima || '-'}</p>
                </div>
                <XCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por rúbrica, equipo, juez o comentarios..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
              />
            </div>
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Evaluations List */}
        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Lista de Evaluaciones ({filteredEvaluations.length})
          </h2>

          {loadingEvaluations ? (
            <div className="text-center py-12">
              <div className="text-gray-300">Cargando evaluaciones...</div>
            </div>
          ) : user.role === 'CAMPISTA' ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Vista de evaluaciones para campistas</p>
              <p className="text-sm text-gray-500">
                Las evaluaciones se muestran en la página de cada entrega individual
              </p>
              <Link
                href="/entregas"
                className="inline-block mt-4 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/80 transition-colors"
              >
                Ver Mis Entregas
              </Link>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {evaluations.length === 0
                  ? 'No hay evaluaciones registradas aún'
                  : 'No se encontraron evaluaciones con ese criterio de búsqueda'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="bg-brand-dark rounded-lg border border-brand-purple/20 p-5 hover:border-brand-purple/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {evaluation.rubric?.nombre || 'Rúbrica desconocida'}
                        </h3>
                        <span className="px-3 py-1 bg-brand-purple/20 text-brand-cyan text-sm rounded-full border border-brand-purple/40">
                          {evaluation.rubric?.porcentaje}% del total
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{evaluation.team?.nombre || 'Equipo desconocido'}</span>
                        </div>

                        {user.role === 'ORGANIZADOR' && evaluation.juez && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            <span>
                              Juez: {evaluation.juez.nombres} {evaluation.juez.apellidos}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(evaluation.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="text-3xl font-bold text-white">
                          {evaluation.calificacion}
                        </span>
                        <span className="text-gray-400">
                          / {evaluation.rubric?.escalaMaxima || 100}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {((Number(evaluation.calificacion) / (evaluation.rubric?.escalaMaxima || 100)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {evaluation.rubric?.descripcion && (
                    <div className="mb-3 text-sm text-gray-400">
                      <p className="italic">"{evaluation.rubric.descripcion}"</p>
                    </div>
                  )}

                  {evaluation.comentarios && (
                    <div className="bg-brand-navy/50 rounded-lg p-4 border border-brand-purple/20">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-brand-cyan mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-brand-cyan font-medium mb-1">
                            Comentarios del Juez:
                          </p>
                          <p className="text-sm text-gray-300">{evaluation.comentarios}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info para Jueces */}
        {user.role === 'JUEZ' && (
          <div className="bg-brand-purple/10 border-l-4 border-brand-purple p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-brand-purple mb-2 flex items-center gap-2">
              <Award className="h-5 w-5" />
              ¿Cómo evaluar entregas?
            </h3>
            <div className="text-gray-300 space-y-2">
              <p>Para evaluar las entregas de los equipos:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Ve a <Link href="/hackathones" className="text-brand-cyan hover:underline">Hackathones</Link></li>
                <li>Selecciona el hackathon al que fuiste asignado</li>
                <li>Navega a la sección de entregas</li>
                <li>Haz clic en "Evaluar" en cada entrega</li>
              </ol>
            </div>
          </div>
        )}

        {/* Info para Organizadores */}
        {user.role === 'ORGANIZADOR' && (
          <div className="bg-brand-cyan/10 border-l-4 border-brand-cyan p-6 rounded-r-lg">
            <h3 className="text-lg font-semibold text-brand-cyan mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Panel de Administración
            </h3>
            <p className="text-gray-300">
              Aquí puedes ver todas las evaluaciones realizadas por los jueces en todos los hackathones.
              Usa el buscador para filtrar por rúbrica, equipo o juez específico.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
