'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { challengeService } from '@/services/challenge.service';
import { submissionService } from '@/services/submission.service';
import { teamService } from '@/services/team.service';
import { Challenge } from '@/types/challenge';
import { Team } from '@/types/team';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, Upload, FileText, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NuevaEntregaPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params?.id as string;
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    teamId: '',
    titulo: '',
    descripcion: '',
    comentarios: '',
  });

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (user.role !== 'CAMPISTA') {
      toast.error('Solo los campistas pueden subir entregas');
      router.push(`/desafios/${challengeId}`);
      return;
    }

    loadData();
  }, [user, token, challengeId]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoadingData(true);

      // Cargar desafío
      const challengeData = await challengeService.getById(challengeId);
      setChallenge(challengeData);

      // Cargar mis equipos
      const teams = await teamService.getAll(token);
      setMyTeams(teams);

      // Si solo hay un equipo, seleccionarlo automáticamente
      if (teams.length === 1) {
        setFormData(prev => ({ ...prev, teamId: teams[0].id }));
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar los datos');
      router.push(`/desafios/${challengeId}`);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (file.type !== 'application/pdf') {
        toast.error('Solo se permiten archivos PDF');
        return;
      }

      // Validar tamaño (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !challenge) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!formData.teamId) {
      toast.error('Debes seleccionar un equipo');
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error('Debes ingresar un título');
      return;
    }

    if (!formData.descripcion.trim()) {
      toast.error('Debes ingresar una descripción');
      return;
    }

    if (!selectedFile) {
      toast.error('Debes seleccionar un archivo PDF');
      return;
    }

    try {
      setLoading(true);

      // Primero subir el archivo PDF
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: uploadFormData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el archivo');
      }

      const { url: pdfUrl } = await uploadResponse.json();

      // Luego crear la submission
      const submissionData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        challengeId: challenge.id,
        teamId: formData.teamId,
        documentacionUrl: pdfUrl, // El PDF va como documentación
        comentarios: formData.comentarios || undefined,
      };

      const submission = await submissionService.create(submissionData, token);

      toast.success('Entrega enviada exitosamente');
      router.push(`/desafios/${challengeId}`);
    } catch (error: any) {
      console.error('Error al crear entrega:', error);
      toast.error(error.message || 'Error al enviar la entrega');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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

  if (!challenge) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/desafios/${challengeId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Entrega</h1>
            <p className="text-gray-600 mt-1">{challenge.titulo}</p>
          </div>
        </div>

        {/* Advertencia si no tiene equipos */}
        {myTeams.length === 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 mb-1">
                    No perteneces a ningún equipo
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Para enviar una solución, primero debes ser parte de un equipo.
                  </p>
                  <Link
                    href="/equipos/nuevo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    <Users className="h-4 w-4" />
                    Crear Equipo
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        {myTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Información de la Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de equipo */}
                <div>
                  <Label htmlFor="teamId">
                    Equipo <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="teamId"
                    value={formData.teamId}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
                    required
                    disabled={myTeams.length === 1}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Selecciona un equipo</option>
                    {myTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona el equipo con el que estás resolviendo este desafío
                  </p>
                </div>

                {/* Título */}
                <div>
                  <Label htmlFor="titulo">
                    Título de la Entrega <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="titulo"
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Sistema de Gestión de Inventario"
                    required
                    maxLength={200}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <Label htmlFor="descripcion">
                    Descripción <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe tu solución al reto..."
                    rows={4}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Subir archivo */}
                <div>
                  <Label htmlFor="file">
                    Archivo PDF (Documentación) <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1">
                    <label
                      htmlFor="file"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileText className="h-10 w-10 text-gray-400 mb-2" />
                        {selectedFile ? (
                          <div className="text-center">
                            <p className="text-sm text-gray-700 font-medium">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Click para subir</span> o arrastra el archivo
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PDF (máx. 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                </div>

                {/* Comentarios Adicionales */}
                <div>
                  <Label htmlFor="comentarios">Comentarios Adicionales (opcional)</Label>
                  <textarea
                    id="comentarios"
                    value={formData.comentarios}
                    onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                    placeholder="Agrega cualquier comentario o aclaración sobre tu solución..."
                    rows={4}
                    maxLength={500}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.comentarios.length}/500 caracteres
                  </p>
                </div>

                {/* Información importante */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      ℹ️ Antes de enviar
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Asegúrate de que tu archivo PDF contenga toda la documentación requerida</li>
                      <li>• Verifica que el archivo se pueda abrir correctamente</li>
                      <li>• Una vez enviada, la entrega estará en revisión</li>
                      <li>• Podrás ver el estado de tu entrega en el dashboard</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/desafios/${challengeId}`)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.teamId || !selectedFile}
                    className="flex-1"
                  >
                    {loading ? 'Enviando...' : 'Enviar Entrega'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
