'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { challengeService } from '@/services/challenge.service';
import { categoryService, Category } from '@/services/category.service';
import {
  CreateChallengeDto,
  ChallengeDifficulty,
  ChallengeStatus,
} from '@/types/challenge';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Upload, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NuevoDesafioPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<CreateChallengeDto>({
    titulo: '',
    descripcion: '',
    dificultad: ChallengeDifficulty.MEDIO,
    estado: ChallengeStatus.DRAFT,
    puntos: undefined,
    porcentaje: 0,
    criteriosEvaluacion: '',
    recursos: '',
    entregables: '',
    fechaLimite: '',
    urlPdf: '',
    orden: 0,
    categoryId: '',
  });

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    if (token) {
      loadCategories();
    }
  }, [token]);

  const loadCategories = async () => {
    if (!token) return;

    try {
      setLoadingCategories(true);
      const data = await categoryService.getAll(token);
      setCategories(data.filter((c) => c.activa)); // Solo categorías activas
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
      toast.error(error.message || 'Error al cargar las categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB');
      return;
    }

    if (!token) {
      toast.error('No estás autenticado');
      return;
    }

    try {
      setUploadingPdf(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload/pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const data = await response.json();

      // Actualizar el formData con la URL del PDF
      setFormData((prev) => ({
        ...prev,
        urlPdf: data.url,
      }));

      setPdfFile(file);
      toast.success('PDF cargado exitosamente');
    } catch (error: any) {
      console.error('Error al subir PDF:', error);
      toast.error(error.message || 'Error al subir el PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setFormData((prev) => ({
      ...prev,
      urlPdf: '',
    }));
    toast.success('PDF removido');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === 'number') {
      if (value === '') {
        processedValue = name === 'porcentaje' ? 0 : undefined;
      } else {
        // Usar parseFloat para porcentaje (permite decimales), parseInt para otros
        processedValue = name === 'porcentaje' ? parseFloat(value) : parseInt(value, 10);
      }
    } else if (type === 'datetime-local') {
      processedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    } else if (formData.titulo.length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length < 20) {
      newErrors.descripcion = 'La descripción debe tener al menos 20 caracteres';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Debes seleccionar una categoría';
    }

    if (formData.puntos && formData.puntos < 1) {
      newErrors.puntos = 'Los puntos deben ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      const dataToSubmit: CreateChallengeDto = {
        ...formData,
        estado: asDraft ? ChallengeStatus.DRAFT : formData.estado,
        criteriosEvaluacion: formData.criteriosEvaluacion?.trim() || undefined,
        recursos: formData.recursos?.trim() || undefined,
        entregables: formData.entregables?.trim() || undefined,
        fechaLimite: formData.fechaLimite || undefined,
        urlPdf: formData.urlPdf?.trim() || undefined,
      };

      const newChallenge = await challengeService.create(dataToSubmit, token);

      toast.success(
        asDraft
          ? 'Desafío guardado como borrador'
          : 'Desafío creado exitosamente'
      );

      router.push(`/desafios/${newChallenge.id}`);
    } catch (error: any) {
      console.error('Error al crear desafío:', error);
      toast.error(error.message || 'Error al crear el desafío');
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
            Solo los organizadores pueden crear desafíos
          </p>
          <Link
            href="/desafios"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Desafíos
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
            href="/desafios"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crear Nuevo Desafío
            </h1>
            <p className="mt-1 text-gray-600">
              Completa la información para crear un desafío
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

            {/* Título */}
            <div>
              <label
                htmlFor="titulo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Título del Desafío <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Clasificador de Imágenes con CNN"
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="descripcion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Descripción <span className="text-red-500">*</span>
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
                placeholder="Describe el desafío, qué deben hacer los participantes, objetivos, etc."
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Categoría <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <p className="text-gray-500">Cargando categorías...</p>
              ) : categories.length === 0 ? (
                <p className="text-red-500">
                  No hay categorías disponibles. Crea un hackathon primero.
                </p>
              ) : (
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.hackathon?.nombre} - {category.nombre}
                      {category.topic && ` (${category.topic.nombre})`}
                    </option>
                  ))}
                </select>
              )}
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
              )}
            </div>

            {/* Dificultad, Puntos y Porcentaje */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dificultad */}
              <div>
                <label
                  htmlFor="dificultad"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Dificultad
                </label>
                <select
                  id="dificultad"
                  name="dificultad"
                  value={formData.dificultad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={ChallengeDifficulty.FACIL}>Fácil</option>
                  <option value={ChallengeDifficulty.MEDIO}>Medio</option>
                  <option value={ChallengeDifficulty.DIFICIL}>Difícil</option>
                  <option value={ChallengeDifficulty.EXPERTO}>Experto</option>
                </select>
              </div>

              {/* Puntos */}
              <div>
                <label
                  htmlFor="puntos"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Puntos
                </label>
                <input
                  type="number"
                  id="puntos"
                  name="puntos"
                  value={formData.puntos || ''}
                  onChange={handleChange}
                  min={1}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.puntos ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 100"
                />
                {errors.puntos && (
                  <p className="mt-1 text-sm text-red-600">{errors.puntos}</p>
                )}
              </div>

              {/* Porcentaje */}
              <div>
                <label
                  htmlFor="porcentaje"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Porcentaje (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="porcentaje"
                  name="porcentaje"
                  value={formData.porcentaje}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  step={0.01}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.porcentaje ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 40"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Del total del hackathon (máx. 100%)
                </p>
                {errors.porcentaje && (
                  <p className="mt-1 text-sm text-red-600">{errors.porcentaje}</p>
                )}
              </div>
            </div>

            {/* Fecha Límite */}
            <div>
              <label
                htmlFor="fechaLimite"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fecha Límite de Entrega
              </label>
              <input
                type="datetime-local"
                id="fechaLimite"
                name="fechaLimite"
                value={formData.fechaLimite}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Detalles del Desafío */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles del Desafío
            </h2>

            {/* Criterios de Evaluación */}
            <div>
              <label
                htmlFor="criteriosEvaluacion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Criterios de Evaluación
              </label>
              <textarea
                id="criteriosEvaluacion"
                name="criteriosEvaluacion"
                value={formData.criteriosEvaluacion}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Precisión del modelo (40%), Código limpio (30%), Documentación (30%)"
              />
            </div>

            {/* Entregables */}
            <div>
              <label
                htmlFor="entregables"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Entregables Requeridos
              </label>
              <textarea
                id="entregables"
                name="entregables"
                value={formData.entregables}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: PDF con descripción de la solución, link al repositorio GitHub, capturas de pantalla"
              />
            </div>

            {/* Recursos */}
            <div>
              <label
                htmlFor="recursos"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Recursos y Enlaces de Ayuda
              </label>
              <textarea
                id="recursos"
                name="recursos"
                value={formData.recursos}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enlaces a documentación, tutoriales, datasets, APIs, etc."
              />
            </div>

            {/* PDF del Desafío */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF del Desafío (opcional)
              </label>

              {!pdfFile && !formData.urlPdf ? (
                <div className="mt-1">
                  <label
                    htmlFor="pdf-upload"
                    className="flex justify-center items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadingPdf ? 'Subiendo PDF...' : 'Click para subir un PDF'}
                    </span>
                  </label>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    className="hidden"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Máximo 10MB. Sube el enunciado completo del desafío en formato PDF.
                  </p>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded">
                      <span className="text-red-600 font-semibold text-xs">PDF</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pdfFile?.name || 'PDF cargado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Archivo subido'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar PDF"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {formData.urlPdf && (
                <a
                  href={formData.urlPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  Ver PDF
                </a>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
            <Link
              href="/desafios"
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
                    Crear Desafío
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
