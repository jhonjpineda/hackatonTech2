'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { judgeAssignmentService } from '@/services/judge-assignment.service';
import { authService } from '@/services/auth.service';
import { judgeService } from '@/services/judge.service';
import { hackathonService } from '@/services/hackathonService';
import { teamService } from '@/services/team.service';
import { Shield, Trash2, UserCheck } from 'lucide-react';

interface Judge {
  id: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface Team {
  id: string;
  nombre: string;
}

interface JudgeAssignment {
  id: string;
  juez: Judge;
  equipos: Team[];
}

export default function HackathonJudgesPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [selectedJudge, setSelectedJudge] = useState('');
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hackathonName, setHackathonName] = useState('');

  useEffect(() => {
    loadData();
  }, [hackathonId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [judgesData, teamsData, assignmentsData, hackathonData] = await Promise.all([
        judgeService.getAllJudges(token),
        teamService.getTeamsByHackathon(hackathonId, token),
        judgeAssignmentService.getHackathonJudges(hackathonId, token),
        hackathonService.getById(hackathonId),
      ]);

      setJudges(judgesData);
      setTeams(teamsData);
      setAssignments(assignmentsData);
      setHackathonName(hackathonData.nombre);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJudge = async () => {
    if (!selectedJudge) {
      setError('Selecciona un juez');
      return;
    }

    if (!assignToAll && selectedTeams.length === 0) {
      setError('Selecciona al menos un equipo');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      await judgeAssignmentService.assignJudge(
        {
          juezId: selectedJudge,
          hackathonId,
          teamIds: assignToAll ? undefined : selectedTeams,
        },
        token
      );

      setSelectedJudge('');
      setSelectedTeams([]);
      setError('');
      await loadData();
    } catch (err) {
      console.error('Error assigning judge:', err);
      setError('Error al asignar el juez');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('¿Estas seguro de eliminar esta asignacion?')) {
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      await judgeAssignmentService.removeAssignment(assignmentId, token);
      await loadData();
    } catch (err) {
      console.error('Error removing assignment:', err);
      setError('Error al eliminar la asignacion');
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-200">Cargando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-unicauca-purple" />
          <div>
            <h1 className="text-3xl font-bold text-white">Gestion de Jueces</h1>
            <p className="text-gray-300 mt-1">{hackathonName}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-unicauca-navy rounded-lg border border-unicauca-purple/30 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Asignar Juez
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Seleccionar Juez
              </label>
              <select
                value={selectedJudge}
                onChange={(e) => setSelectedJudge(e.target.value)}
                className="w-full px-4 py-2 bg-unicauca-dark border border-unicauca-purple/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-unicauca-purple"
              >
                <option value="">-- Selecciona un juez --</option>
                {judges.map((judge) => (
                  <option key={judge.id} value={judge.id}>
                    {judge.usuario.nombre} ({judge.usuario.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-200">
                <input
                  type="checkbox"
                  checked={assignToAll}
                  onChange={(e) => {
                    setAssignToAll(e.target.checked);
                    if (e.target.checked) {
                      setSelectedTeams([]);
                    }
                  }}
                  className="w-4 h-4 text-unicauca-purple bg-unicauca-dark border-unicauca-purple/30 rounded focus:ring-unicauca-purple"
                />
                Asignar a todos los equipos
              </label>
            </div>

            {!assignToAll && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Seleccionar Equipos
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-unicauca-dark rounded-lg p-3 border border-unicauca-purple/30">
                  {teams.length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay equipos disponibles</p>
                  ) : (
                    teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex items-center gap-2 text-gray-200 hover:bg-unicauca-navy/50 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => handleTeamToggle(team.id)}
                          className="w-4 h-4 text-unicauca-purple bg-unicauca-dark border-unicauca-purple/30 rounded focus:ring-unicauca-purple"
                        />
                        {team.nombre}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleAssignJudge}
              className="w-full px-4 py-2 bg-unicauca-purple text-white rounded-lg hover:bg-unicauca-purple/80 transition-colors shadow-lg font-medium"
            >
              Asignar Juez
            </button>
          </div>
        </div>

        <div className="bg-unicauca-navy rounded-lg border border-unicauca-purple/30 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Jueces Asignados</h2>

          {assignments.length === 0 ? (
            <p className="text-gray-400">No hay jueces asignados a este hackathon</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-unicauca-dark rounded-lg p-4 border border-unicauca-purple/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        {assignment.juez.usuario.nombre}
                      </h3>
                      <p className="text-sm text-gray-400">{assignment.juez.usuario.email}</p>
                      {assignment.equipos && assignment.equipos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-300">Equipos asignados:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {assignment.equipos.map((team) => (
                              <span
                                key={team.id}
                                className="px-2 py-1 bg-unicauca-purple/20 text-unicauca-purple text-xs rounded"
                              >
                                {team.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar asignacion"
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
    </DashboardLayout>
  );
}
