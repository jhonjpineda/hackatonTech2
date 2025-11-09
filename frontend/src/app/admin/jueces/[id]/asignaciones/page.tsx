'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { judgeAssignmentService } from '@/services/judge-assignment.service';
import { authService } from '@/services/auth.service';
import { ArrowLeft, Calendar, Trophy, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface JudgeAssignment {
  id: string;
  hackathon: {
    id: string;
    nombre: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    modalidad: string;
  };
  canSeeAllTeams: boolean;
  assignedTeams?: Array<{
    id: string;
    nombre: string;
  }>;
  activo: boolean;
  createdAt: string;
}

export default function JudgeAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const judgeId = params.id as string;

  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [judgeName, setJudgeName] = useState('');

  useEffect(() => {
    loadAssignments();
  }, [judgeId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await judgeAssignmentService.getJudgeAssignments(judgeId, token);
      setAssignments(data);

      // Obtener nombre del juez del primer assignment (si existe)
      if (data.length > 0 && data[0].juez) {
        const juez = data[0].juez;
        setJudgeName(`${juez.nombres} ${juez.apellidos}`);
      }
    } catch (error: any) {
      console.error('Error al cargar asignaciones:', error);
      toast.error('Error al cargar las asignaciones del juez');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (hackathon: any) => {
    const now = new Date();
    const inicio = new Date(hackathon.fechaInicio);
    const fin = new Date(hackathon.fechaFin);

    if (now < inicio) {
      return (
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium border border-blue-500/40">
          Próximo
        </span>
      );
    } else if (now >= inicio && now <= fin) {
      return (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium border border-green-500/40">
          En progreso
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full font-medium border border-gray-500/40">
          Finalizado
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-200">Cargando asignaciones...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/jueces"
              className="p-2 hover:bg-brand-purple/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Asignaciones del Juez</h1>
              {judgeName && <p className="text-gray-300 mt-1">{judgeName}</p>}
            </div>
          </div>
        </div>

        {/* Lista de asignaciones */}
        {assignments.length === 0 ? (
          <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Sin asignaciones
            </h3>
            <p className="text-gray-300">
              Este juez aún no ha sido asignado a ningún hackathon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6 hover:border-brand-purple/50 transition-colors"
              >
                {/* Header del card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {assignment.hackathon.nombre}
                    </h3>
                    {getStatusBadge(assignment.hackathon)}
                  </div>
                </div>

                {/* Descripción */}
                {assignment.hackathon.descripcion && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {assignment.hackathon.descripcion}
                  </p>
                )}

                {/* Información del hackathon */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <Calendar className="h-4 w-4 text-brand-purple" />
                    <span>
                      {formatDate(assignment.hackathon.fechaInicio)} -{' '}
                      {formatDate(assignment.hackathon.fechaFin)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <Trophy className="h-4 w-4 text-brand-purple" />
                    <span className="capitalize">{assignment.hackathon.modalidad}</span>
                  </div>
                </div>

                {/* Equipos asignados */}
                <div className="pt-4 border-t border-brand-purple/20">
                  {assignment.canSeeAllTeams ? (
                    <div className="flex items-center gap-2 text-brand-cyan text-sm font-medium">
                      <Users className="h-4 w-4" />
                      <span>Puede evaluar todos los equipos</span>
                    </div>
                  ) : assignment.assignedTeams && assignment.assignedTeams.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-200 font-medium mb-2">
                        Equipos asignados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.assignedTeams.map((team) => (
                          <span
                            key={team.id}
                            className="px-2 py-1 bg-brand-purple/20 text-brand-cyan text-xs rounded-full border border-brand-purple/40"
                          >
                            {team.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Sin equipos específicos asignados</p>
                  )}
                </div>

                {/* Link al hackathon */}
                <Link
                  href={`/hackathones/${assignment.hackathon.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-brand-purple hover:text-brand-purple/80 text-sm font-medium transition-colors"
                >
                  Ver hackathon →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Estadísticas */}
        {assignments.length > 0 && (
          <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-brand-dark rounded-lg p-4 border border-brand-purple/20">
                <p className="text-sm text-gray-300 mb-1">Total de Hackathons</p>
                <p className="text-3xl font-bold text-white">{assignments.length}</p>
              </div>
              <div className="bg-brand-dark rounded-lg p-4 border border-brand-purple/20">
                <p className="text-sm text-gray-300 mb-1">Asignaciones Activas</p>
                <p className="text-3xl font-bold text-white">
                  {assignments.filter((a) => a.activo).length}
                </p>
              </div>
              <div className="bg-brand-dark rounded-lg p-4 border border-brand-purple/20">
                <p className="text-sm text-gray-300 mb-1">Todos los Equipos</p>
                <p className="text-3xl font-bold text-white">
                  {assignments.filter((a) => a.canSeeAllTeams).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
