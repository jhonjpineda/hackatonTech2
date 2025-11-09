'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { judgeAssignmentService } from '@/services/judge-assignment.service';
import { authService } from '@/services/auth.service';
import { judgeService } from '@/services/judge.service';
import { hackathonService } from '@/services/hackathonService';
import { teamService } from '@/services/team.service';
import { Shield, Trash2, UserPlus } from 'lucide-react';

interface Judge {
  id: string;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  status: string;
  createdAt: string;
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
          <Shield className="h-8 w-8 text-brand-purple" />
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

        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
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
                className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-brand-dark text-gray-300">-- Selecciona un juez --</option>
                {judges.map((judge) => (
                  <option key={judge.id} value={judge.id} className="bg-brand-dark text-white">
                    {judge.nombres} {judge.apellidos} ({judge.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-100 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={assignToAll}
                  onChange={(e) => {
                    setAssignToAll(e.target.checked);
                    if (e.target.checked) {
                      setSelectedTeams([]);
                    }
                  }}
                  className="w-5 h-5 text-brand-purple bg-brand-navy border-2 border-brand-purple/50 rounded focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-brand-dark cursor-pointer"
                />
                <span className="font-medium">Asignar a todos los equipos</span>
              </label>
            </div>

            {!assignToAll && (
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Seleccionar Equipos
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto bg-brand-dark rounded-lg p-3 border border-brand-purple/50">
                  {teams.length === 0 ? (
                    <p className="text-gray-300 text-sm py-2">No hay equipos disponibles en este hackathon</p>
                  ) : (
                    teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex items-center gap-3 text-gray-100 hover:bg-brand-navy/70 p-2 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => handleTeamToggle(team.id)}
                          className="w-5 h-5 text-brand-purple bg-brand-navy border-2 border-brand-purple/50 rounded focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-brand-dark cursor-pointer"
                        />
                        <span className="font-medium">{team.nombre}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleAssignJudge}
              className="w-full px-4 py-3 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 active:bg-brand-purple/70 transition-all shadow-lg font-semibold text-base focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-brand-navy"
            >
              Asignar Juez
            </button>
          </div>
        </div>

        <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Jueces Asignados</h2>

          {assignments.length === 0 ? (
            <p className="text-gray-300 text-center py-4">No hay jueces asignados a este hackathon</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-brand-dark rounded-lg p-4 border border-brand-purple/30 hover:border-brand-purple/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">
                        {assignment.juez.nombres} {assignment.juez.apellidos}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">{assignment.juez.email}</p>
                      {assignment.equipos && assignment.equipos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-200 font-medium mb-2">Equipos asignados:</p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.equipos.map((team) => (
                              <span
                                key={team.id}
                                className="px-3 py-1 bg-brand-purple/30 text-brand-cyan text-sm rounded-full font-medium border border-brand-purple/40"
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
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500/50"
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
