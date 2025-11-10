'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { User, Settings as SettingsIcon, Mail, Phone, CreditCard, Calendar, MapPin, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { topicService, Topic } from '@/services/topic.service';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Campos editables
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Topics
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Inicializar campos con datos del usuario
    setNombres(user.nombres || '');
    setApellidos(user.apellidos || '');
    setEmail(user.email || '');
    setTelefono(user.telefono || '');

    // Cargar topics si es campista
    if (user.role === 'CAMPISTA') {
      loadTopics();
    }
  }, [user, router]);

  const loadTopics = async () => {
    try {
      setLoadingTopics(true);
      const topics = await topicService.getAllActive();
      setAvailableTopics(topics);
    } catch (error) {
      console.error('Error al cargar temas:', error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await refreshUser();
      toast.success('Información actualizada');
    } catch (error) {
      toast.error('Error al actualizar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTopics = async () => {
    if (!token) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/sync-topics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al sincronizar temas');
      }

      await refreshUser();
      toast.success('Temas de interés sincronizados desde SIGA');
    } catch (error: any) {
      toast.error(error.message || 'Error al sincronizar temas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const updateData: any = {};

      // Para organizadores y jueces, permitir editar datos personales
      if (user.role === 'ORGANIZADOR' || user.role === 'JUEZ') {
        if (nombres && nombres !== user.nombres) updateData.nombres = nombres;
        if (apellidos && apellidos !== user.apellidos) updateData.apellidos = apellidos;
        if (email && email !== user.email) updateData.email = email;
        if (telefono !== user.telefono) updateData.telefono = telefono || undefined;
      }

      // Para campistas, permitir agregar temas de interés adicionales
      if (user.role === 'CAMPISTA' && selectedTopicIds.length > 0) {
        updateData.interestTopicIds = selectedTopicIds;
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('No hay cambios para guardar');
        return;
      }

      await authService.updateProfile(updateData);
      await refreshUser();

      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
      setSelectedTopicIds([]); // Limpiar selección de topics
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!user) return;

    setNombres(user.nombres || '');
    setApellidos(user.apellidos || '');
    setEmail(user.email || '');
    setTelefono(user.telefono || '');
    setSelectedTopicIds([]);
    setIsEditing(false);
  };

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleRemoveTopic = async (topicId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await authService.removeInterestTopic(topicId);
      await refreshUser();
      toast.success('Tema eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar tema:', error);
      toast.error(error.response?.data?.message || 'No puedes eliminar el tema principal de SIGA');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = user && (user.role === 'ORGANIZADOR' || user.role === 'JUEZ');
  const isCampista = user?.role === 'CAMPISTA';

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-[#b64cff]" />
              <h1 className="text-3xl font-bold text-white">
                Configuración
              </h1>
            </div>
            {canEdit && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#b64cff] hover:bg-[#b64cff]/80 text-white"
              >
                Editar Perfil
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
          <p className="text-gray-300">
            {canEdit
              ? 'Gestiona tu información personal y preferencias'
              : 'Visualiza tu información personal sincronizada con SIGA'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Nombres</Label>
                    <Input
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      disabled={!canEdit || !isEditing}
                      className="bg-[#1d1d3e] border-[#b64cff]/30 text-white disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-200">Apellidos</Label>
                    <Input
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      disabled={!canEdit || !isEditing}
                      className="bg-[#1d1d3e] border-[#b64cff]/30 text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-gray-200">
                    <CreditCard className="h-4 w-4" />
                    Documento
                  </Label>
                  <Input
                    value={user.documento}
                    disabled
                    className="bg-[#1d1d3e] border-[#b64cff]/30 text-white disabled:opacity-60"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    El documento no puede ser modificado
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-gray-200">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!canEdit || !isEditing}
                    className="bg-[#1d1d3e] border-[#b64cff]/30 text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-gray-200">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={!canEdit || !isEditing}
                    placeholder="Opcional"
                    className="bg-[#1d1d3e] border-[#b64cff]/30 text-white disabled:opacity-60"
                  />
                </div>

                <div className="pt-4 border-t border-[#b64cff]/30">
                  {isCampista ? (
                    <p className="text-sm text-gray-300">
                      💡 Los datos personales provienen de SIGA y no pueden ser modificados.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300">
                      ℹ️ Como {user.role}, puedes editar tu información personal.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de SIGA (solo para campistas) */}
            {isCampista && (
              <Card className="bg-[#00ffff]/10 border-[#00ffff]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#00ffff]">
                    <MapPin className="h-5 w-5" />
                    Información de SIGA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Nombre Completo</p>
                      <p className="text-white font-medium">{user.nombres} {user.apellidos}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Documento</p>
                      <p className="text-white font-medium">{user.documento}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email Institucional</p>
                      <p className="text-white font-medium truncate">{user.email}</p>
                    </div>
                    {user.telefono && (
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-white font-medium">{user.telefono}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-[#00ffff]/20">
                    <p className="text-xs text-gray-300">
                      Esta información está sincronizada automáticamente desde el sistema SIGA
                      de TalentoTech y refleja tus datos institucionales.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Temas de Interés */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Temas de Interés</CardTitle>
                  {isCampista && (
                    <Button
                      onClick={handleSyncTopics}
                      disabled={loading}
                      size="sm"
                      className="bg-[#b64cff] hover:bg-[#b64cff]/80 text-white"
                    >
                      {loading ? 'Sincronizando...' : user.interestTopics && user.interestTopics.length > 0 ? 'Re-sincronizar SIGA' : 'Sincronizar desde SIGA'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Temas actuales del usuario */}
                {user.interestTopics && user.interestTopics.length > 0 ? (
                  <>
                    {isCampista ? (
                      <div className="space-y-4">
                        {/* Tema principal de SIGA */}
                        <div>
                          <p className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-[#00ffff] rounded-full"></span>
                            Tema Principal (SIGA - No modificable):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="default"
                              className="text-sm px-3 py-1.5 bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]/60 font-semibold"
                            >
                              {user.interestTopics[0]?.nombre}
                            </Badge>
                          </div>
                        </div>

                        {/* Temas adicionales */}
                        {user.interestTopics.length > 1 && (
                          <div className="pt-3 border-t border-[#b64cff]/20">
                            <p className="text-sm text-gray-300 mb-2">
                              Temas Adicionales (puedes eliminarlos):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {user.interestTopics.slice(1).map((topic) => (
                                <Badge
                                  key={topic.id}
                                  variant="default"
                                  className="text-sm px-3 py-1 bg-[#b64cff]/20 text-[#b64cff] border-[#b64cff]/40 flex items-center gap-2"
                                >
                                  {topic.nombre}
                                  <button
                                    onClick={() => handleRemoveTopic(topic.id)}
                                    disabled={loading}
                                    className="ml-1 hover:bg-[#b64cff]/40 rounded-full p-0.5 transition-colors"
                                    title="Eliminar tema"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 mb-4">
                          Tus temas de interés:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {user.interestTopics.map((topic) => (
                            <Badge
                              key={topic.id}
                              variant="default"
                              className="text-sm px-3 py-1 bg-[#b64cff]/20 text-[#00ffff] border-[#b64cff]/40"
                            >
                              {topic.nombre}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 mb-4">
                    <p className="text-gray-300 mb-4">
                      No tienes temas de interés configurados
                    </p>
                  </div>
                )}

                {/* Selector de temas adicionales para campistas */}
                {isCampista && (
                  <div className="pt-4 border-t border-[#b64cff]/30">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-200">
                        Agregar temas de interés adicionales
                      </p>
                      {selectedTopicIds.length > 0 && (
                        <Button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Guardar ({selectedTopicIds.length})
                        </Button>
                      )}
                    </div>
                    {loadingTopics ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b64cff] mx-auto"></div>
                      </div>
                    ) : availableTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableTopics
                          .filter(topic => !user.interestTopics?.some(ut => ut.id === topic.id))
                          .map((topic) => (
                            <button
                              key={topic.id}
                              onClick={() => toggleTopicSelection(topic.id)}
                              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                                selectedTopicIds.includes(topic.id)
                                  ? 'bg-[#b64cff] text-white border-[#b64cff]'
                                  : 'bg-transparent text-gray-300 border-gray-600 hover:border-[#b64cff] hover:text-[#b64cff]'
                              }`}
                            >
                              {topic.nombre}
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No hay temas adicionales disponibles
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-3">
                      Los temas adicionales complementan tu tema principal de SIGA y te ayudan a descubrir más hackathones relevantes.
                    </p>
                  </div>
                )}

                {!isCampista && (
                  <p className="text-xs text-gray-400 mt-3">
                    Los hackathones se asignan automáticamente según estos temas de interés.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de Información */}
          <div className="space-y-6">
            {/* Rol y Estado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rol y Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Rol
                  </p>
                  <Badge
                    className={
                      user.role === 'ORGANIZADOR'
                        ? 'bg-[#b64cff] text-white'
                        : user.role === 'JUEZ'
                        ? 'bg-[#00ffff]/20 text-[#00ffff] border-[#00ffff]/40'
                        : 'bg-gray-700 text-gray-300'
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Estado
                  </p>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600/40">{user.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Información de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Cuenta creada
                  </p>
                  <p className="text-white">
                    {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Última actualización
                  </p>
                  <p className="text-white">
                    {new Date(user.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-[#b64cff] text-white hover:bg-[#b64cff]/20"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Información'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Información adicional para campistas */}
        {isCampista && (
          <div className="mt-8">
            <Card className="bg-[#b64cff]/10 border-[#b64cff]/30">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="h-5 w-5 text-[#00ffff]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Integración con SIGA
                    </h3>
                    <p className="text-sm text-gray-300">
                      Tu cuenta está vinculada con el sistema SIGA de TalentoTech. Los datos
                      personales y el tema de interés principal se sincronizan automáticamente.
                      Puedes agregar temas adicionales para ampliar tus opciones de hackathones.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
