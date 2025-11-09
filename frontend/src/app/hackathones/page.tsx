'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HackathonCard } from '@/components/hackathons/HackathonCard';
import { hackathonService } from '@/services/hackathonService';
import { judgeAssignmentService } from '@/services/judge-assignment.service';
import { Hackathon, HackathonStatus } from '@/types/hackathon';
import { Plus, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HackathonesPage() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<HackathonStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    try {
      setLoading(true);
      setError('');
      let data: Hackathon[];

      if (user?.role === 'ORGANIZADOR' && token) {
        // Organizadores ven todos sus hackathones
        data = await hackathonService.getMyHackathons(token);
      } else if (user?.role === 'JUEZ' && token) {
        // Jueces solo ven los hackathones asignados
        const assignments = await judgeAssignmentService.getMyAssignments(token);
        data = assignments
          .filter(assignment => assignment.hackathon)
          .map(assignment => assignment.hackathon as any);
      } else {
        // Otros usuarios ven hackathones públicos
        data = await hackathonService.getPublic();
      }

      setHackathons(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los hackathones');
    } finally {
      setLoading(false);
    }
  };

  const filteredHackathons = hackathons.filter((hackathon) => {
    const matchesSearch = hackathon.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'ALL' || hackathon.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando hackathones...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hackathones</h1>
            <p className="mt-1 text-gray-600">
              {user.role === 'ORGANIZADOR'
                ? 'Gestiona tus hackathones'
                : 'Explora y participa en hackathones'}
            </p>
          </div>
          {user.role === 'ORGANIZADOR' && (
            <Link
              href="/hackathones/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nuevo Hackathon
            </Link>
          )}
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar hackathones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as HackathonStatus | 'ALL')
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">Todos los estados</option>
                <option value={HackathonStatus.DRAFT}>Borrador</option>
                <option value={HackathonStatus.PUBLISHED}>Publicado</option>
                <option value={HackathonStatus.IN_PROGRESS}>En Progreso</option>
                <option value={HackathonStatus.FINISHED}>Finalizado</option>
                <option value={HackathonStatus.CANCELLED}>Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Lista de hackathones */}
        {filteredHackathons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No hay hackathones disponibles
            </h3>
            <p className="text-gray-600">
              {user.role === 'ORGANIZADOR'
                ? 'Crea tu primer hackathon para empezar'
                : 'No hay hackathones públicos en este momento'}
            </p>
            {user.role === 'ORGANIZADOR' && (
              <Link
                href="/hackathones/nuevo"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Crear Hackathon
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredHackathons.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        )}

        {/* Contador */}
        {filteredHackathons.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Mostrando {filteredHackathons.length} de {hackathons.length}{' '}
            hackathones
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
