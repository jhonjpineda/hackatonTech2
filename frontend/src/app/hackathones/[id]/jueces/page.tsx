'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { authService, User } from '@/services/auth.service';
import { judgeAssignmentService, JudgeAssignment } from '@/services/judge-assignment.service';
import { teamService, Team } from '@/services/team.service';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus, Users, Trash2 } from 'lucide-react';

export default function HackathonJudgesPage() {
  const router = useRouter();
  const params = useParams();
  const hackathonId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [judges, setJudges] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [assignToAll, setAssignToAll] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getToken();

    if (!storedUser || !storedToken) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (storedUser.role !== 'ORGANIZADOR') {
      toast.error('No tienes permisos');
      router.push('/');
      return;
    }

    setUser(storedUser);
    setToken(storedToken);
    loadData(storedToken);
  }, [router, hackathonId]);

  const loadData = async (authToken: string) => {
    try {
      setLoading(true);
      const [judgesData, assignmentsData, teamsData] = await Promise.all([
        authService.getAllJudges(),
        judgeAssignmentService.getHackathonJudges(hackathonId, authToken),
        teamService.getTeamsByHackathon(hackathonId, authToken),
      ]);
      setJudges(judgesData);
      setAssignments(assignmentsData);
      setTeams(teamsData);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJudge = async () => {
    if (!selectedJudge || !token) return;

    try {
      setLoading(true);
      await judgeAssignmentService.assignJudge(
        {
          juezId: selectedJudge,
          hackathonId,
          teamIds: assignToAll ? undefined : selectedTeams,
        },
        token
      );
      toast.success('Juez asignado exitosamente');
      setShowForm(false);
      setSelectedJudge('');
      setSelectedTeams([]);
      setAssignToAll(true);
      await loadData(token);
    } catch (error: any) {
      toast.error(error.message || 'Error al asignar juez');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!token || !confirm('¿Remover esta asignación?')) return;

    try {
      await judgeAssignmentService.removeAssignment(assignmentId, token);
      toast.success('Asignación removida');
      await loadData(token);
    } catch (error: any) {
      toast.error(error.message || 'Error al remover');
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  if (!user || !token) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-200 text-lg">Cargando...</div>
        </div>
      </DashboardLayout>
    );
  }

  const availableJudges = judges.filter(j => !assignments.some(a => a.juezId === j.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href={`/hackathones/${hackathonId}`} className="inline-flex items-center gap-2 text-gray-300 hover:text-unicauca-cyan mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al Hackathon
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-unicauca-purple" />
                Gestión de Jueces
              </h1>
              <p className="mt-2 text-gray-300">Asigna jueces para evaluar este hackathon</p>
            </div>
            {!showForm && availableJudges.length > 0 && (
              <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-unicauca-purple text-white rounded-lg hover:bg-unicauca-purple/80 transition-colors font-medium shadow-lg">
                <UserPlus className="h-5 w-5" />
                Asignar Juez
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="bg-unicauca-navy rounded-lg border border-unicauca-purple/30 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Asignar Nuevo Juez</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-unicauca-cyan">Cancelar</button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Seleccionar Juez *</label>
                <select value={selectedJudge} onChange={(e) => setSelectedJudge(e.target.value)} className="w-full px-4 py-2 bg-unicauca-dark border border-unicauca-purple/30 rounded-lg focus:ring-2 focus:ring-unicauca-purple text-white">
                  <option value="">Selecciona un juez...</option>
                  {availableJudges.map((judge) => (
                    <option key={judge.id} value={judge.id}>{judge.nombres} {judge.apellidos} - {judge.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="checkbox" id="assignToAll" checked={assignToAll} onChange={(e) => setAssignToAll(e.target.checked)} className="w-4 h-4 text-unicauca-purple rounded" />
                  <label htmlFor="assignToAll" className="text-sm font-medium text-gray-200">Asignar a todos los equipos</label>
                </div>
                {!assignToAll && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">Seleccionar Equipos</label>
                    <div className="max-h-60 overflow-y-auto space-y-2 bg-unicauca-dark p-4 rounded-lg border border-unicauca-purple/20">
                      {teams.map((team) => (
                        <label key={team.id} className="flex items-center gap-3 p-2 hover:bg-unicauca-purple/10 rounded cursor-pointer">
                          <input type="checkbox" checked={selectedTeams.includes(team.id)} onChange={() => toggleTeam(team.id)} className="w-4 h-4" />
                          <span className="text-gray-200">{team.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={handleAssignJudge} disabled={!selectedJudge || loading || (!assignToAll && selectedTeams.length === 0)} className="flex-1 px-6 py-3 bg-unicauca-purple text-white rounded-lg hover:bg-unicauca-purple/80 disabled:opacity-50 shadow-lg">{loading ? 'Asignando...' : 'Asignar Juez'}</button>
                <button onClick={() => setShowForm(false)} className="px-6 py-3 border border-unicauca-purple/30 text-gray-300 rounded-lg hover:bg-unicauca-dark">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-unicauca-navy rounded-lg border border-unicauca-purple/30 shadow-lg">
          <div className="p-6 border-b border-unicauca-purple/30">
            <h2 className="text-xl font-semibold text-white">Jueces Asignados ({assignments.length})</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-300">Cargando...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No hay jueces asignados aún</div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-unicauca-dark p-4 rounded-lg border border-unicauca-purple/20 hover:border-unicauca-purple/40">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{assignment.juez?.nombres} {assignment.juez?.apellidos}</h3>
                          {assignment.canSeeAllTeams && (
                            <span className="px-2 py-1 bg-unicauca-cyan/20 text-unicauca-cyan text-xs font-semibold rounded border border-unicauca-cyan/30">Todos los equipos</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{assignment.juez?.email}</p>
                        {assignment.assignedTeams && assignment.assignedTeams.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-300 mb-2">Equipos:</p>
                            <div className="flex flex-wrap gap-2">
                              {assignment.assignedTeams.map((team) => (
                                <span key={team.id} className="px-3 py-1 bg-unicauca-lavender/20 text-unicauca-lavender text-sm rounded border border-unicauca-lavender/30">{team.nombre}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleRemoveAssignment(assignment.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
