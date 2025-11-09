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
import { User, Settings as SettingsIcon, Mail, Phone, CreditCard, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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

      await refreshUser(); // Recargar usuario con los nuevos temas
      toast.success('Temas de interés sincronizados desde SIGA');
    } catch (error: any) {
      toast.error(error.message || 'Error al sincronizar temas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-[#b64cff]" />
            <h1 className="text-3xl font-bold text-white">
              Configuración
            </h1>
          </div>
          <p className="text-gray-300">
            Gestiona tu información personal y preferencias
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
                      value={user.nombres}
                      disabled
                      className="bg-[#1d1d3e] border-[#b64cff]/30 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-200">Apellidos</Label>
                    <Input
                      value={user.apellidos}
                      disabled
                      className="bg-[#1d1d3e] border-[#b64cff]/30 text-white"
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
                    className="bg-[#1d1d3e] border-[#b64cff]/30 text-white"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-gray-200">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    value={user.email}
                    disabled
                    className="bg-[#1d1d3e] border-[#b64cff]/30 text-white"
                  />
                </div>

                {user.telefono && (
                  <div>
                    <Label className="flex items-center gap-2 text-gray-200">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input
                      value={user.telefono}
                      disabled
                      className="bg-[#1d1d3e] border-[#b64cff]/30 text-white"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-[#b64cff]/30">
                  <p className="text-sm text-gray-300">
                    💡 Los datos personales provienen de SIGA y no pueden ser modificados aquí.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Temas de Interés */}
            <Card>
              <CardHeader>
                <CardTitle>Temas de Interés</CardTitle>
              </CardHeader>
              <CardContent>
                {user.interestTopics && user.interestTopics.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-300 mb-4">
                      Estos son los temas que te interesan según tu perfil de SIGA:
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                    <p className="text-xs text-gray-400 mt-4">
                      Los hackathones se asignarán automáticamente según estos temas de interés.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-300 mb-4">
                      No tienes temas de interés configurados
                    </p>
                    {user.role !== 'JUEZ' && (
                      <>
                        <Button
                          onClick={handleSyncTopics}
                          disabled={loading}
                          className="mx-auto bg-[#b64cff] hover:bg-[#b64cff]/80 text-white"
                        >
                          {loading ? 'Sincronizando...' : 'Sincronizar desde SIGA'}
                        </Button>
                        <p className="text-xs text-gray-400 mt-3">
                          Sincroniza tus temas de interés desde tu perfil de SIGA
                        </p>
                      </>
                    )}
                  </div>
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

        {/* Información adicional */}
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
                    Tu cuenta está vinculada con el sistema SIGA de TalentoTech. Los temas de
                    interés y datos personales se sincronizan automáticamente desde tu perfil SIGA.
                    Los hackathones disponibles se filtran según tus temas de interés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
