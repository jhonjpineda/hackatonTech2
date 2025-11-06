'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import { judgeAssignmentService, JudgeAssignment } from '@/services/judge-assignment.service';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Users,
  Trash2,
  ArrowLeft,
  Shield,
  Eye,
  Check,
  X
} from 'lucide-react';

interface Team {
  id: string;
  nombre: string;
  descripcion?: string;
  category?: {
    nombre: string;
  };
}

export default function HackathonJuecesPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [judges, setJudges] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hackathon, setHackathon] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    juezId: '',
    canSeeAllTeams: true,
    selectedTeamIds: [] as string[],
  });

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getToken();

    if (!storedUser || !storedToken) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (storedUser.role !== 'ORGANIZADOR') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
      return;
    }

    setUser(storedUser);
    setToken(storedToken);
    loadData(storedToken);
  }, [router, hackathonId]);

  const loadData = async (authToken: string) => {
    try {
      setLoadingAssignments(true);

      // Cargar hackathon
      const hackathonResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/hackathons/${hackathonId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (hackathonResponse.ok) {
        const hackathonData = await hackathonResponse.json();
        setHackathon(hackathonData);
      }

      // Cargar asignaciones del hackathon
      const assignmentsData = await judgeAssignmentService.getHackathonJudges(
        hackathonId,
        authToken
      );
      setAssignments(assignmentsData);

      // Cargar todos los jueces
      const judgesData = await authService.getAllJudges();
      setJudges(judgesData);

      // Cargar equipos del hackathon
      const categoriesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories/hackathon/${hackathonId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        const allTeams: Team[] = [];

        for (const category of categories) {
          const teamsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/teams/category/${category.id}`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );

          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            allTeams.push(
              ...teamsData.map((t: any) => ({
                ...t,
                category: { nombre: category.nombre },
              }))
            );
          }
        }

        setTeams(allTeams);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar datos');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!formData.juezId) {
      toast.error('Selecciona un juez');
      return;
    }

    // Verificar si el juez ya está asignado
    const alreadyAssigned = assignments.some((a) => a.juezId === formData.juezId);
    if (alreadyAssigned) {
      toast.error('Este juez ya está asignado a este hackathon');
      return;
    }

    try {
      setLoading(true);

      const assignmentData = {
        juezId: formData.juezId,
        hackathonId,
        teamIds: formData.canSeeAllTeams ? undefined : formData.selectedTeamIds,
      };

      await judgeAssignmentService.assignJudge(assignmentData, token);

      toast.success('Juez asignado exitosamente');

      // Recargar asignaciones
      await loadData(token);

      // Limpiar formulario
      setFormData({
        juezId: '',
        canSeeAllTeams: true,
        selectedTeamIds: [],
      });
      setShowForm(false);
    } catch (error: any) {
      console.error('Error al asignar juez:', error);
      toast.error(error.message || 'Error al asignar juez');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!token) return;

    if (!confirm('¿Estás seguro de que deseas remover esta asignación?')) {
      return;
    }

    try {
      await judgeAssignmentService.removeAssignment(assignmentId, token);
      toast.success('Asignación removida exitosamente');
      await loadData(token);
    } catch (error: any) {
      console.error('Error al remover asignación:', error);
      toast.error(error.message || 'Error al remover asignación');
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTeamIds: prev.selectedTeamIds.includes(teamId)
        ? prev.selectedTeamIds.filter((id) => id !== teamId)
        : [...prev.selectedTeamIds, teamId],
    }));
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
          <Link
            href={`/hackathones/${hackathonId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Hackathon
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-600" />
                Jueces del Hackathon
              </h1>
              {hackathon && (
                <p className="mt-2 text-gray-600">
                  {hackathon.nombre}
                </p>
              )}
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <UserPlus className="h-5 w-5" />
                Asignar Juez
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Asignar Juez al Hackathon</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="juezId" className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Juez *
                </label>
                <select
                  id="juezId"
                  value={formData.juezId}
                  onChange={(e) => setFormData({ ...formData, juezId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona un juez</option>
                  {judges.map((judge) => (
                    <option key={judge.id} value={judge.id}>
                      {judge.nombres} {judge.apellidos} ({judge.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canSeeAllTeams}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        canSeeAllTeams: e.target.checked,
                        selectedTeamIds: e.target.checked ? [] : formData.selectedTeamIds,
                      })
                    }
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Puede ver todos los equipos
                    </span>
                    <p className="text-sm text-gray-500">
                      El juez podrá evaluar a todos los equipos del hackathon
                    </p>
                  </div>
                </label>
              </div>

              {!formData.canSeeAllTeams && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Equipos Asignados ({formData.selectedTeamIds.length} seleccionados)
                  </label>

                  {teams.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay equipos disponibles en este hackathon
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {teams.map((team) => (
                        <label
                          key={team.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedTeamIds.includes(team.id)}
                            onChange={() => toggleTeamSelection(team.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {team.nombre}
                            </div>
                            {team.category && (
                              <div className="text-xs text-gray-500">
                                Categoría: {team.category.nombre}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Si no seleccionas equipos específicos, el juez podrá ver
                  y evaluar a todos los equipos del hackathon.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Asignando...' : 'Asignar Juez'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assignments List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Jueces Asignados ({assignments.length})
            </h2>
          </div>

          <div className="p-6">
            {loadingAssignments ? (
              <div className="text-center py-8 text-gray-600">
                Cargando asignaciones...
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay jueces asignados a este hackathon aún
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.juez?.nombres} {assignment.juez?.apellidos}
                          </h3>
                        </div>

                        <div className="ml-8 space-y-1">
                          <p className="text-sm text-gray-600">
                            Email: {assignment.juez?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Documento: {assignment.juez?.documento}
                          </p>

                          <div className="mt-3">
                            {assignment.canSeeAllTeams ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <Eye className="h-4 w-4" />
                                Puede ver todos los equipos
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  Equipos asignados: {assignment.assignedTeams?.length || 0}
                                </span>
                                {assignment.assignedTeams && assignment.assignedTeams.length > 0 && (
                                  <div className="mt-2 ml-4">
                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                      {assignment.assignedTeams.map((team) => (
                                        <li key={team.id}>{team.nombre}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover asignación"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
