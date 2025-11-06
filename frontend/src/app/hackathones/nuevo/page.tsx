'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { hackathonService } from '@/services/hackathonService';
import { topicsService, Topic } from '@/services/topics.service';
import { CreateHackathonDto, HackathonMode, HackathonStatus } from '@/types/hackathon';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ImageUpload } from '@/components/upload/ImageUpload';

export default function NuevoHackathonPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const [formData, setFormData] = useState<CreateHackathonDto>({
    nombre: '',
    descripcion: '',
    descripcionCorta: '',
    modalidad: HackathonMode.PRESENCIAL,
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteInscripcion: '',
    ubicacion: '',
    urlImagen: undefined,
    maxParticipantes: undefined,
    maxEquipos: undefined,
    minMiembrosEquipo: 1,
    maxMiembrosEquipo: 5,
    requisitos: '',
    premios: '',
    reglas: '',
    recursos: '',
    urlDiscord: '',
    urlSlack: '',
    urlWhatsapp: '',
    inscripcionAbierta: true,
    publicado: false,
    estado: HackathonStatus.DRAFT,
    topicsIds: [],
  });

  // Cargar topics al montar el componente
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await topicsService.getActive();
        setTopics(data);
      } catch (error) {
        console.error('Error al cargar los temas:', error);
        toast.error('Error al cargar los temas');
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchTopics();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === 'number') {
      processedValue = value === '' ? undefined : parseInt(value, 10);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setFormData((prev) => {
      const currentTopics = prev.topicsIds || [];
      const isSelected = currentTopics.includes(topicId);

      return {
        ...prev,
        topicsIds: isSelected
          ? currentTopics.filter((id) => id !== topicId)
          : [...currentTopics, topicId],
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validaciones requeridas
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida';
    }

    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es requerida';
    }

    if (!formData.fechaLimiteInscripcion) {
      newErrors.fechaLimiteInscripcion = 'La fecha límite de inscripción es requerida';
    }

    // Validaciones de fechas
    if (formData.fechaInicio && formData.fechaFin) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);

      if (fin <= inicio) {
        newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (formData.fechaLimiteInscripcion && formData.fechaInicio) {
      const limite = new Date(formData.fechaLimiteInscripcion);
      const inicio = new Date(formData.fechaInicio);

      if (limite >= inicio) {
        newErrors.fechaLimiteInscripcion =
          'La fecha límite debe ser anterior a la fecha de inicio';
      }
    }

    // Validación de miembros de equipo
    if (formData.maxMiembrosEquipo < formData.minMiembrosEquipo) {
      newErrors.maxMiembrosEquipo =
        'El máximo de miembros no puede ser menor al mínimo';
    }

    // Validación de URLs - Solo validar si tienen contenido Y no son URLs válidas
    if (formData.urlDiscord && formData.urlDiscord.trim() && !isValidUrl(formData.urlDiscord)) {
      newErrors.urlDiscord = 'URL de Discord inválida';
    }

    if (formData.urlSlack && formData.urlSlack.trim() && !isValidUrl(formData.urlSlack)) {
      newErrors.urlSlack = 'URL de Slack inválida';
    }

    if (formData.urlWhatsapp && formData.urlWhatsapp.trim() && !isValidUrl(formData.urlWhatsapp)) {
      newErrors.urlWhatsapp = 'URL de WhatsApp inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    if (!token) {
      toast.error('No estás autenticado');
      return;
    }

    try {
      setLoading(true);

      // Limpiar campos vacíos para evitar errores de validación en el backend
      const dataToSubmit: CreateHackathonDto = {
        ...formData,
        estado: asDraft ? HackathonStatus.DRAFT : formData.estado,
        publicado: !asDraft && formData.publicado,
        // Solo incluir URLs si tienen contenido válido
        urlImagen: formData.urlImagen?.trim() || undefined,
        urlDiscord: formData.urlDiscord?.trim() || undefined,
        urlSlack: formData.urlSlack?.trim() || undefined,
        urlWhatsapp: formData.urlWhatsapp?.trim() || undefined,
        // Limpiar otros campos opcionales vacíos
        descripcionCorta: formData.descripcionCorta?.trim() || undefined,
        ubicacion: formData.ubicacion?.trim() || undefined,
        requisitos: formData.requisitos?.trim() || undefined,
        premios: formData.premios?.trim() || undefined,
        reglas: formData.reglas?.trim() || undefined,
        recursos: formData.recursos?.trim() || undefined,
      };

      const newHackathon = await hackathonService.create(dataToSubmit, token);

      toast.success(
        asDraft
          ? 'Hackathon guardado como borrador'
          : 'Hackathon creado exitosamente'
      );

      router.push(`/hackathones/${newHackathon.id}`);
    } catch (error: any) {
      console.error('Error al crear hackathon:', error);
      toast.error(error.message || 'Error al crear el hackathon');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ORGANIZADOR') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            Solo los organizadores pueden crear hackathones
          </p>
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/hackathones"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crear Nuevo Hackathon
            </h1>
            <p className="mt-1 text-gray-600">
              Completa la información para crear un hackathon
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Información Básica
            </h2>

            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Hackathon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Hackathon IA 2025"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Descripción Corta */}
            <div>
              <label
                htmlFor="descripcionCorta"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Descripción Corta
              </label>
              <input
                type="text"
                id="descripcionCorta"
                name="descripcionCorta"
                value={formData.descripcionCorta}
                onChange={handleChange}
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción breve para la tarjeta (máx. 200 caracteres)"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.descripcionCorta?.length || 0}/200 caracteres
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="descripcion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Descripción Completa <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.descripcion ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe el hackathon, sus objetivos y lo que los participantes pueden esperar..."
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
              )}
            </div>

            {/* Modalidad */}
            <div>
              <label
                htmlFor="modalidad"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Modalidad <span className="text-red-500">*</span>
              </label>
              <select
                id="modalidad"
                name="modalidad"
                value={formData.modalidad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={HackathonMode.PRESENCIAL}>Presencial</option>
                <option value={HackathonMode.VIRTUAL}>Virtual</option>
                <option value={HackathonMode.HIBRIDO}>Híbrido</option>
              </select>
            </div>

            {/* Temas a Tratar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Temas a Tratar
              </label>
              {loadingTopics ? (
                <p className="text-gray-500">Cargando temas...</p>
              ) : topics.length === 0 ? (
                <p className="text-gray-500">No hay temas disponibles</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {topics.map((topic) => {
                    const isSelected = formData.topicsIds?.includes(topic.id) || false;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => handleTopicToggle(topic.id)}
                        className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {topic.icono && <span className="text-xl">{topic.icono}</span>}
                        <span className="text-sm font-medium">{topic.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-2 text-sm text-gray-500">
                {formData.topicsIds?.length || 0} tema(s) seleccionado(s)
              </p>
            </div>

            {/* Imagen/Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen del Hackathon
              </label>
              {token && (
                <ImageUpload
                  token={token}
                  currentImageUrl={formData.urlImagen}
                  onUploadComplete={(url) => {
                    setFormData((prev) => ({ ...prev, urlImagen: url }));
                  }}
                />
              )}
            </div>

            {/* Ubicación */}
            {(formData.modalidad === HackathonMode.PRESENCIAL ||
              formData.modalidad === HackathonMode.HIBRIDO) && (
              <div>
                <label
                  htmlFor="ubicacion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ubicación
                </label>
                <input
                  type="text"
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Campus Principal - Edificio A, Sala 101"
                />
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Fechas</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha Límite Inscripción */}
              <div>
                <label
                  htmlFor="fechaLimiteInscripcion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Límite de Inscripción <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="fechaLimiteInscripcion"
                  name="fechaLimiteInscripcion"
                  value={formData.fechaLimiteInscripcion}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fechaLimiteInscripcion
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {errors.fechaLimiteInscripcion && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.fechaLimiteInscripcion}
                  </p>
                )}
              </div>

              {/* Fecha Inicio */}
              <div>
                <label
                  htmlFor="fechaInicio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fechaInicio ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fechaInicio && (
                  <p className="mt-1 text-sm text-red-600">{errors.fechaInicio}</p>
                )}
              </div>

              {/* Fecha Fin */}
              <div>
                <label
                  htmlFor="fechaFin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="fechaFin"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fechaFin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fechaFin && (
                  <p className="mt-1 text-sm text-red-600">{errors.fechaFin}</p>
                )}
              </div>
            </div>
          </div>

          {/* Configuración de Equipos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Configuración de Equipos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mínimo de Miembros */}
              <div>
                <label
                  htmlFor="minMiembrosEquipo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mínimo de Miembros por Equipo{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="minMiembrosEquipo"
                  name="minMiembrosEquipo"
                  value={formData.minMiembrosEquipo}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Máximo de Miembros */}
              <div>
                <label
                  htmlFor="maxMiembrosEquipo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Máximo de Miembros por Equipo{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="maxMiembrosEquipo"
                  name="maxMiembrosEquipo"
                  value={formData.maxMiembrosEquipo}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxMiembrosEquipo ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxMiembrosEquipo && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.maxMiembrosEquipo}
                  </p>
                )}
              </div>

              {/* Máximo de Participantes */}
              <div>
                <label
                  htmlFor="maxParticipantes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Máximo de Participantes
                </label>
                <input
                  type="number"
                  id="maxParticipantes"
                  name="maxParticipantes"
                  value={formData.maxParticipantes || ''}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dejar vacío para ilimitado"
                />
              </div>

              {/* Máximo de Equipos */}
              <div>
                <label
                  htmlFor="maxEquipos"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Máximo de Equipos
                </label>
                <input
                  type="number"
                  id="maxEquipos"
                  name="maxEquipos"
                  value={formData.maxEquipos || ''}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dejar vacío para ilimitado"
                />
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Información Adicional
            </h2>

            {/* Requisitos */}
            <div>
              <label
                htmlFor="requisitos"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Requisitos
              </label>
              <textarea
                id="requisitos"
                name="requisitos"
                value={formData.requisitos}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Conocimientos necesarios, herramientas, etc."
              />
            </div>

            {/* Premios */}
            <div>
              <label
                htmlFor="premios"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Premios
              </label>
              <textarea
                id="premios"
                name="premios"
                value={formData.premios}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe los premios para los ganadores"
              />
            </div>

            {/* Reglas */}
            <div>
              <label
                htmlFor="reglas"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reglas
              </label>
              <textarea
                id="reglas"
                name="reglas"
                value={formData.reglas}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reglas del hackathon"
              />
            </div>

            {/* Recursos */}
            <div>
              <label
                htmlFor="recursos"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Recursos Disponibles
              </label>
              <textarea
                id="recursos"
                name="recursos"
                value={formData.recursos}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="APIs, herramientas, mentores, etc."
              />
            </div>
          </div>

          {/* Enlaces de Comunicación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Canales de Comunicación
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discord */}
              <div>
                <label
                  htmlFor="urlDiscord"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL de Discord
                </label>
                <input
                  type="url"
                  id="urlDiscord"
                  name="urlDiscord"
                  value={formData.urlDiscord}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.urlDiscord ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://discord.gg/ejemplo"
                />
                {errors.urlDiscord && (
                  <p className="mt-1 text-sm text-red-600">{errors.urlDiscord}</p>
                )}
              </div>

              {/* Slack */}
              <div>
                <label
                  htmlFor="urlSlack"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL de Slack
                </label>
                <input
                  type="url"
                  id="urlSlack"
                  name="urlSlack"
                  value={formData.urlSlack}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.urlSlack ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://slack.com/ejemplo"
                />
                {errors.urlSlack && (
                  <p className="mt-1 text-sm text-red-600">{errors.urlSlack}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label
                  htmlFor="urlWhatsapp"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  URL de WhatsApp
                </label>
                <input
                  type="url"
                  id="urlWhatsapp"
                  name="urlWhatsapp"
                  value={formData.urlWhatsapp}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.urlWhatsapp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://chat.whatsapp.com/ejemplo"
                />
                {errors.urlWhatsapp && (
                  <p className="mt-1 text-sm text-red-600">{errors.urlWhatsapp}</p>
                )}
              </div>
            </div>
          </div>

          {/* Configuración de Publicación */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Configuración de Publicación
            </h2>

            <div className="space-y-4">
              {/* Inscripción Abierta */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="inscripcionAbierta"
                  name="inscripcionAbierta"
                  checked={formData.inscripcionAbierta}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="inscripcionAbierta"
                  className="text-sm font-medium text-gray-700"
                >
                  Inscripción abierta
                </label>
              </div>

              {/* Publicado */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="publicado"
                  name="publicado"
                  checked={formData.publicado}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="publicado"
                  className="text-sm font-medium text-gray-700"
                >
                  Publicar inmediatamente
                </label>
              </div>

              <p className="text-sm text-gray-500">
                Si no publicas ahora, el hackathon se guardará como borrador y
                podrás publicarlo más tarde.
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
            <Link
              href="/hackathones"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                Guardar Borrador
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Crear Hackathon
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
