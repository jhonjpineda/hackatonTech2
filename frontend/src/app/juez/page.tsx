'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import { judgeAssignmentService, JudgeAssignment } from '@/services/judge-assignment.service';
import toast from 'react-hot-toast';
import { Shield, Calendar, Users, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function JuezDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadAssignments(storedToken);
  }, [router]);

  const loadAssignments = async (authToken: string) => {
    try {
      setLoading(true);
      const assignmentsData = await judgeAssignmentService.getMyAssignments(authToken);
      setAssignments(assignmentsData);
    } catch (error: any) {
      console.error('Error al cargar asignaciones:', error);
      toast.error(error.message || 'Error al cargar asignaciones');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-10 w-10 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Juez
              </h1>
              <p className="text-gray-600">
                Bienvenido, {user.nombres} {user.apellidos}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hackathones Asignados</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Equipos Accesibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.reduce((total, a) => {
                    if (a.canSeeAllTeams) return total + 0; // No podemos contar sin saber el total
                    return total + (a.assignedTeams?.length || 0);
                  }, 0)}
                  {assignments.some((a) => a.canSeeAllTeams) && '+'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="text-lg font-semibold text-green-600">Activo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Mis Hackathones Asignados
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-600">
                Cargando asignaciones...
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No tienes hackathones asignados aún</p>
                <p className="text-sm text-gray-400">
                  Espera a que un administrador te asigne a un hackathon
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {assignment.hackathon?.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.hackathon?.descripcion}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        Asignado el{' '}
                        {format(new Date(assignment.createdAt), 'dd/MM/yyyy', { locale: es })}
                      </div>

                      {assignment.canSeeAllTeams ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Eye className="h-4 w-4" />
                          Puedes evaluar a todos los equipos
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Users className="h-4 w-4" />
                          {assignment.assignedTeams?.length || 0} equipos asignados
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/juez/hackathon/${assignment.hackathonId}`}
                      className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Ver Entregas
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Instrucciones para Jueces
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">1.</span>
              Selecciona un hackathon asignado para ver las entregas disponibles
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">2.</span>
              Revisa cada entrega cuidadosamente antes de calificar
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">3.</span>
              Proporciona retroalimentación constructiva en tus evaluaciones
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">4.</span>
              Asegúrate de calificar según los criterios establecidos en las rúbricas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">5.</span>
              Si tienes alguna duda, contacta con el organizador del hackathon
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
