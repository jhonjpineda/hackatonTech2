'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teamService } from '@/services/team.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, UserPlus, Search, Users, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface User {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  documento: string;
  interestTopics?: { id: string; nombre: string }[];
}

interface Team {
  id: string;
  nombre: string;
  liderId: string;
  categoryId: string;
  category?: {
    hackathon: {
      maxMiembrosEquipo: number;
      minMiembrosEquipo: number;
    };
  };
  miembros: User[];
}

export default function AgregarMiembroPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    loadTeam();
  }, [user, token, teamId]);

  const loadTeam = async () => {
    if (!token) return;

    try {
      setLoadingTeam(true);
      const data = await teamService.getById(teamId, token);
      setTeam(data);

      // Verificar que el usuario actual es el líder
      if (data.liderId !== user?.id) {
        toast.error('Solo el líder puede agregar miembros');
        router.push(`/equipos/${teamId}`);
      }
    } catch (error: any) {
      console.error('Error al cargar equipo:', error);
      toast.error(error.message || 'Error al cargar el equipo');
      router.push('/equipos');
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !searchQuery.trim()) {
      toast.error('Por favor ingresa un documento para buscar');
      return;
    }

    try {
      setSearchLoading(true);
      setHasSearched(true);
      setSearchResults([]);

      // Buscar usuario en el backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/search-by-documento/${searchQuery.trim()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 404) {
        toast.error('Usuario no encontrado');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al buscar usuario');
      }

      const userData = await response.json();
      setSearchResults([userData]);
    } catch (error: any) {
      console.error('Error al buscar usuario:', error);
      toast.error(error.message || 'Error al buscar usuario');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!token || !team) return;

    // Verificar límite de miembros
    const currentMembers = team.miembros.length + 1; // +1 por el líder
    const maxMembers = team.category?.hackathon?.maxMiembrosEquipo;

    if (maxMembers && currentMembers >= maxMembers) {
      toast.error(`El equipo ha alcanzado el límite de ${maxMembers} miembros`);
      return;
    }

    try {
      setLoading(true);
      await teamService.addMember(team.id, { userId }, token);
      toast.success('Miembro agregado exitosamente');
      router.push(`/equipos/${teamId}`);
    } catch (error: any) {
      console.error('Error al agregar miembro:', error);
      toast.error(error.message || 'Error al agregar miembro al equipo');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTeam) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return null;
  }

  const currentMembers = team.miembros.length + 1;
  const maxMembers = team.category?.hackathon?.maxMiembrosEquipo;
  const isAtCapacity = maxMembers ? currentMembers >= maxMembers : false;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/equipos/${teamId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agregar Miembro</h1>
            <p className="text-gray-600 mt-1">
              Buscar y agregar miembros a {team.nombre}
            </p>
          </div>
        </div>

        {/* Información del equipo */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Miembros actuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentMembers}
                    {maxMembers && <span className="text-base text-gray-500"> / {maxMembers}</span>}
                  </p>
                </div>
              </div>
              {isAtCapacity && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Capacidad máxima alcanzada</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario de búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Usuario por Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="documento">
                  Documento de Identidad <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3 mt-1">
                  <Input
                    id="documento"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej: 1003933839"
                    required
                    disabled={isAtCapacity}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim() || isAtCapacity}
                  >
                    {searchLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el número de documento del usuario que deseas agregar
                </p>
              </div>
            </form>

            {/* Resultados de búsqueda */}
            {hasSearched && !searchLoading && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Resultado de búsqueda:
                    </h3>
                    {searchResults.map((foundUser) => {
                      const isAlreadyMember = team.miembros.some(m => m.id === foundUser.id);
                      const isLeader = team.liderId === foundUser.id;
                      const isSelf = user?.id === foundUser.id;

                      return (
                        <div
                          key={foundUser.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                            {foundUser.nombres.charAt(0)}
                            {foundUser.apellidos.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {foundUser.nombres} {foundUser.apellidos}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-600">{foundUser.email}</p>
                            </div>
                            {foundUser.interestTopics && foundUser.interestTopics.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {foundUser.interestTopics.map((topic) => (
                                  <span
                                    key={topic.id}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {topic.nombre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isLeader ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                Líder del equipo
                              </span>
                            ) : isAlreadyMember ? (
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                Ya es miembro
                              </span>
                            ) : isSelf ? (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Tú
                              </span>
                            ) : (
                              <Button
                                onClick={() => handleAddMember(foundUser.id)}
                                disabled={loading || isAtCapacity}
                                size="sm"
                              >
                                {loading ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Agregar
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-600">
                      No se encontró ningún usuario con ese documento
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información importante */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <h3 className="font-medium text-blue-900 mb-2">
              ℹ️ Información importante
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Solo puedes agregar usuarios que estén registrados en la plataforma</li>
              <li>• Los usuarios deben tener el mismo tema de interés que el líder del equipo</li>
              <li>• Un usuario solo puede pertenecer a un equipo por categoría</li>
              {maxMembers && (
                <li>• El equipo puede tener máximo {maxMembers} miembros</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
