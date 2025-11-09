'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { hackathonService } from '@/services/hackathonService';
import { challengeService } from '@/services/challenge.service';
import { judgeAssignmentService } from '@/services/judge-assignment.service';
import { Hackathon, HackathonStatus, HackathonMode } from '@/types/hackathon';
import { Challenge } from '@/types/challenge';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Monitor,
  Building2,
  Globe,
  ExternalLink,
  Tag,
  Target,
  FileText,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HackathonDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    reasons: string[];
  } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesWithChallenges, setCategoriesWithChallenges] = useState<Map<string, Challenge[]>>(new Map());
  const [assignedJudges, setAssignedJudges] = useState<any[]>([]);

  useEffect(() => {
    if (id && token && user) {
      loadHackathon();
    }
  }, [id, token, user]);

  const loadHackathon = async () => {
    try {
      setLoading(true);
      const data = await hackathonService.getById(id);
      setHackathon(data);

      // Verificar elegibilidad si no es organizador y la inscripción está abierta
      if (token && user && user.id !== data.organizadorId && data.inscripcionAbierta) {
        try {
          const eligibilityData = await hackathonService.checkEligibility(id, token);
          setEligibility(eligibilityData);
        } catch (error) {
          console.error('Error al verificar elegibilidad:', error);
        }
      }

      // Cargar categorías y sus desafíos
      await loadCategoriesAndChallenges(data.id);

      // Cargar jueces asignados si es organizador
      if (token && user && user.id === data.organizadorId) {
        try {
          const judgesData = await judgeAssignmentService.getHackathonJudges(id, token);
          setAssignedJudges(judgesData);
        } catch (error) {
          console.error('Error al cargar jueces asignados:', error);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar el hackathon');
      router.push('/hackathones');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndChallenges = async (hackathonId: string) => {
    try {
      // Cargar categorías del hackathon
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories/hackathon/${hackathonId}`
      );

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);

        // Cargar desafíos para cada categoría
        const challengesMap = new Map<string, Challenge[]>();
        for (const category of categoriesData) {
          try {
            const challenges = await challengeService.getByCategory(category.id);
            if (challenges.length > 0) {
              challengesMap.set(category.id, challenges);
            }
          } catch (error) {
            console.error(`Error loading challenges for category ${category.id}:`, error);
          }
        }
        setCategoriesWithChallenges(challengesMap);
      }
    } catch (error) {
      console.error('Error al cargar categorías y desafíos:', error);
    }
  };

  const handleDelete = async () => {
    if (!token || !hackathon) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este hackathon? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await hackathonService.delete(hackathon.id, token);
      toast.success('Hackathon eliminado exitosamente');
      router.push('/hackathones');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el hackathon');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!token || !hackathon) return;

    try {
      setPublishing(true);
      if (hackathon.publicado) {
        const updated = await hackathonService.unpublish(hackathon.id, token);
        setHackathon(updated);
        toast.success('Hackathon despublicado');
      } else {
        const updated = await hackathonService.publish(hackathon.id, token);
        setHackathon(updated);
        toast.success('Hackathon publicado');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar el estado de publicación');
    } finally {
      setPublishing(false);
    }
  };

  const getStatusBadge = (estado: HackathonStatus) => {
    const badges = {
      [HackathonStatus.DRAFT]: {
        text: 'Borrador',
        className: 'bg-gray-100 text-gray-800',
      },
      [HackathonStatus.PUBLISHED]: {
        text: 'Publicado',
        className: 'bg-blue-100 text-blue-800',
      },
      [HackathonStatus.IN_PROGRESS]: {
        text: 'En Progreso',
        className: 'bg-green-100 text-green-800',
      },
      [HackathonStatus.FINISHED]: {
        text: 'Finalizado',
        className: 'bg-purple-100 text-purple-800',
      },
      [HackathonStatus.CANCELLED]: {
        text: 'Cancelado',
        className: 'bg-red-100 text-red-800',
      },
    };
    return badges[estado];
  };

  const getModalidadIcon = (modalidad: HackathonMode) => {
    const icons = {
      [HackathonMode.PRESENCIAL]: (
        <Building2 className="h-5 w-5 text-blue-600" />
      ),
      [HackathonMode.VIRTUAL]: <Monitor className="h-5 w-5 text-green-600" />,
      [HackathonMode.HIBRIDO]: <Globe className="h-5 w-5 text-purple-600" />,
    };
    return icons[modalidad];
  };

  const getModalidadText = (modalidad: HackathonMode) => {
    const text = {
      [HackathonMode.PRESENCIAL]: 'Presencial',
      [HackathonMode.VIRTUAL]: 'Virtual',
      [HackathonMode.HIBRIDO]: 'Híbrido',
    };
    return text[modalidad];
  };

  const isOrganizador = user?.id === hackathon?.organizadorId;

  const handleRegister = async () => {
    if (!token || !hackathon) {
      toast.error('Debes iniciar sesión para inscribirte');
      return;
    }

    try {
      setRegistering(true);
      await hackathonService.register(hackathon.id, token);
      toast.success('¡Te has inscrito exitosamente al hackathon!');
      loadHackathon(); // Recargar para actualizar el estado
    } catch (error: any) {
      const errorMessage = error.message || 'Error al inscribirse';
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600">Cargando hackathon...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hackathon) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Hackathon no encontrado
          </h2>
          <Link
            href="/hackathones"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Hackathones
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(hackathon.estado);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header con navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/hackathones"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Hackathones
          </Link>

          {isOrganizador && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePublish}
                disabled={publishing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  hackathon.publicado
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
              >
                {publishing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : hackathon.publicado ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
                {hackathon.publicado ? 'Despublicar' : 'Publicar'}
              </button>

              <Link
                href={`/hackathones/${hackathon.id}/editar`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-5 w-5" />
                Editar
              </Link>

              <Link
                href={`/hackathones/${hackathon.id}/jueces`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/80 transition-colors shadow-lg"
              >
                <Shield className="h-5 w-5" />
                Gestionar Jueces
              </Link>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Imagen de portada */}
        <div className="relative h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden">
          {hackathon.urlImagen ? (
            <img
              src={hackathon.urlImagen}
              alt={hackathon.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Trophy className="h-24 w-24 text-white opacity-80" />
            </div>
          )}

          {/* Badges sobre la imagen */}
          <div className="absolute top-4 right-4 flex gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
            >
              {statusBadge.text}
            </span>
            {hackathon.inscripcionAbierta && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                Inscripción Abierta
              </span>
            )}
          </div>
        </div>

        {/* Título y descripción */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {hackathon.nombre}
          </h1>

          {hackathon.descripcionCorta && (
            <p className="text-lg text-gray-600 mb-4">
              {hackathon.descripcionCorta}
            </p>
          )}

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {hackathon.descripcion}
            </p>
          </div>
        </div>

        {/* Temas a Tratar */}
        {hackathon.topics && hackathon.topics.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="h-6 w-6 text-blue-600" />
              Temas a Tratar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {hackathon.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-2 p-3 border-2 border-blue-200 bg-blue-50 rounded-lg"
                  style={{
                    borderColor: topic.colorHex ? `${topic.colorHex}40` : undefined,
                    backgroundColor: topic.colorHex ? `${topic.colorHex}10` : undefined,
                  }}
                >
                  {topic.icono && <span className="text-xl">{topic.icono}</span>}
                  <span className="text-sm font-medium text-gray-900">
                    {topic.nombre}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Este hackathon está enfocado en {hackathon.topics.length} tema(s).
              Solo podrás participar si estás inscrito en un bootcamp relacionado con estos temas.
            </p>
          </div>
        )}

        {/* Información clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fechas y ubicación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información General
            </h2>

            <div className="space-y-3">
              {/* Modalidad */}
              <div className="flex items-center gap-3">
                {getModalidadIcon(hackathon.modalidad)}
                <div>
                  <p className="text-sm text-gray-500">Modalidad</p>
                  <p className="font-medium text-gray-900">
                    {getModalidadText(hackathon.modalidad)}
                  </p>
                </div>
              </div>

              {/* Fecha de inicio */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Inicio</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(hackathon.fechaInicio), "d 'de' MMMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {/* Fecha de fin */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Finalización</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(hackathon.fechaFin), "d 'de' MMMM yyyy, HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {/* Fecha límite inscripción */}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">Límite de inscripción</p>
                  <p className="font-medium text-gray-900">
                    {format(
                      new Date(hackathon.fechaLimiteInscripcion),
                      "d 'de' MMMM yyyy, HH:mm",
                      { locale: es }
                    )}
                  </p>
                </div>
              </div>

              {/* Ubicación */}
              {hackathon.ubicacion && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-500">Ubicación</p>
                    <p className="font-medium text-gray-900">
                      {hackathon.ubicacion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuración de equipos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Equipos y Participantes
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Miembros por equipo</p>
                  <p className="font-medium text-gray-900">
                    {hackathon.minMiembrosEquipo} - {hackathon.maxMiembrosEquipo}{' '}
                    miembros
                  </p>
                </div>
              </div>

              {hackathon.maxParticipantes && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Máximo de participantes</p>
                    <p className="font-medium text-gray-900">
                      {hackathon.maxParticipantes} personas
                    </p>
                  </div>
                </div>
              )}

              {hackathon.maxEquipos && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Máximo de equipos</p>
                    <p className="font-medium text-gray-900">
                      {hackathon.maxEquipos} equipos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secciones de información adicional */}
        {hackathon.requisitos && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Requisitos
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {hackathon.requisitos}
            </p>
          </div>
        )}

        {hackathon.premios && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Premios
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {hackathon.premios}
            </p>
          </div>
        )}

        {/* Jueces Asignados - Solo visible para el organizador */}
        {user && hackathon.organizadorId === user.id && assignedJudges.length > 0 && (
          <div className="bg-brand-navy rounded-lg border border-brand-purple/30 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-6 w-6 text-brand-purple" />
              Jueces Asignados ({assignedJudges.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedJudges.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-brand-dark rounded-lg p-4 border border-brand-purple/20"
                >
                  <h3 className="font-semibold text-white text-base">
                    {assignment.juez.nombres} {assignment.juez.apellidos}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">{assignment.juez.email}</p>
                  {assignment.equipos && assignment.equipos.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">Equipos asignados:</p>
                      <div className="flex flex-wrap gap-1">
                        {assignment.equipos.map((team: any) => (
                          <span
                            key={team.id}
                            className="px-2 py-0.5 bg-brand-purple/20 text-brand-cyan text-xs rounded"
                          >
                            {team.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-cyan mt-2">✓ Todos los equipos</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hackathon.reglas && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reglas</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {hackathon.reglas}
            </p>
          </div>
        )}

        {hackathon.recursos && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recursos Disponibles
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {hackathon.recursos}
            </p>
          </div>
        )}

        {/* Enlaces de comunicación */}
        {(hackathon.urlDiscord || hackathon.urlSlack || hackathon.urlWhatsapp) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Canales de Comunicación
            </h2>
            <div className="flex flex-wrap gap-4">
              {hackathon.urlDiscord && (
                <a
                  href={hackathon.urlDiscord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  Unirse a Discord
                </a>
              )}
              {hackathon.urlSlack && (
                <a
                  href={hackathon.urlSlack}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  Unirse a Slack
                </a>
              )}
              {hackathon.urlWhatsapp && (
                <a
                  href={hackathon.urlWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  Unirse a WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Información del organizador */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Organizador
          </h2>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
              {hackathon.organizador.nombres.charAt(0)}
              {hackathon.organizador.apellidos.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {hackathon.organizador.nombres} {hackathon.organizador.apellidos}
              </p>
              <p className="text-sm text-gray-600">
                {hackathon.organizador.email}
              </p>
            </div>
          </div>
        </div>

        {/* Desafíos del Hackathon */}
        {categories.length > 0 && categoriesWithChallenges.size > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                Desafíos
              </h2>
            </div>

            <div className="space-y-6">
              {categories.map((category) => {
                const challenges = categoriesWithChallenges.get(category.id);
                if (!challenges || challenges.length === 0) return null;

                return (
                  <div key={category.id} className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-purple-600" />
                      {category.nombre}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.map((challenge) => (
                        <Link
                          key={challenge.id}
                          href={`/desafios/${challenge.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 line-clamp-1">
                              {challenge.titulo}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              challenge.dificultad === 'FACIL'
                                ? 'bg-green-100 text-green-800'
                                : challenge.dificultad === 'MEDIO'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {challenge.dificultad}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {challenge.descripcion}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-purple-600">
                              <Trophy className="h-4 w-4" />
                              {challenge.puntos} puntos
                            </span>
                            {challenge.fechaLimite && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Clock className="h-4 w-4" />
                                {format(new Date(challenge.fechaLimite), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botón de acción para participantes */}
        {!isOrganizador && hackathon.inscripcionAbierta && eligibility && (
          <div className={`border rounded-lg p-6 ${
            eligibility.isEligible
              ? 'bg-blue-50 border-blue-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            {eligibility.isEligible ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Listo para participar?
                </h3>
                <p className="text-gray-600 mb-4">
                  Únete a este hackathon y demuestra tus habilidades
                </p>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Inscribiendo...
                    </span>
                  ) : (
                    'Inscribirme al Hackathon'
                  )}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No cumples con los requisitos para participar
                </h3>
                <p className="text-gray-700 mb-3">
                  Razones por las que no puedes inscribirte:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {eligibility.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
