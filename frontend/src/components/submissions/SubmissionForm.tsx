import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CreateSubmissionDto, UpdateSubmissionDto, Submission } from '@/types/submission';

interface SubmissionFormProps {
  initialData?: Submission;
  teamId: string;
  challengeId: string;
  onSubmit: (data: CreateSubmissionDto | UpdateSubmissionDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  initialData,
  teamId,
  challengeId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateSubmissionDto>({
    titulo: initialData?.titulo || '',
    descripcion: initialData?.descripcion || '',
    repositorioUrl: initialData?.repositorioUrl || '',
    demoUrl: initialData?.demoUrl || '',
    videoUrl: initialData?.videoUrl || '',
    documentacionUrl: initialData?.documentacionUrl || '',
    tecnologias: initialData?.tecnologiasArray || [],
    comentarios: initialData?.comentarios || '',
    teamId,
    challengeId,
  });

  const [tecnologiaInput, setTecnologiaInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddTecnologia = () => {
    if (tecnologiaInput.trim() && !formData.tecnologias?.includes(tecnologiaInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tecnologias: [...(prev.tecnologias || []), tecnologiaInput.trim()],
      }));
      setTecnologiaInput('');
    }
  };

  const handleRemoveTecnologia = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tecnologias: prev.tecnologias?.filter((_, i) => i !== index) || [],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.repositorioUrl && !formData.demoUrl && !formData.videoUrl) {
      newErrors.links = 'Debes proporcionar al menos un enlace (repositorio, demo o video)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? 'Editar Entrega' : 'Nueva Entrega'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título del Proyecto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ej: Sistema de Gestión de Inventario"
              disabled={isLoading}
            />
            {errors.titulo && (
              <p className="text-sm text-red-500">{errors.titulo}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe tu proyecto detalladamente..."
              rows={5}
              disabled={isLoading}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-500">{errors.descripcion}</p>
            )}
          </div>

          {/* Enlaces */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm">
              Enlaces <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">
                (Al menos uno es obligatorio)
              </span>
            </h3>

            {errors.links && (
              <p className="text-sm text-red-500">{errors.links}</p>
            )}

            {/* Repositorio */}
            <div className="space-y-2">
              <Label htmlFor="repositorioUrl">Repositorio (GitHub, GitLab, etc.)</Label>
              <Input
                id="repositorioUrl"
                name="repositorioUrl"
                type="url"
                value={formData.repositorioUrl}
                onChange={handleChange}
                placeholder="https://github.com/usuario/proyecto"
                disabled={isLoading}
              />
            </div>

            {/* Demo */}
            <div className="space-y-2">
              <Label htmlFor="demoUrl">Demo / Aplicación Desplegada</Label>
              <Input
                id="demoUrl"
                name="demoUrl"
                type="url"
                value={formData.demoUrl}
                onChange={handleChange}
                placeholder="https://mi-proyecto.vercel.app"
                disabled={isLoading}
              />
            </div>

            {/* Video */}
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video de Presentación</Label>
              <Input
                id="videoUrl"
                name="videoUrl"
                type="url"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                disabled={isLoading}
              />
            </div>

            {/* Documentación */}
            <div className="space-y-2">
              <Label htmlFor="documentacionUrl">Documentación Técnica (opcional)</Label>
              <Input
                id="documentacionUrl"
                name="documentacionUrl"
                type="url"
                value={formData.documentacionUrl}
                onChange={handleChange}
                placeholder="https://docs.mi-proyecto.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tecnologías */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="tecnologiaInput">Tecnologías Utilizadas</Label>
            <div className="flex gap-2">
              <Input
                id="tecnologiaInput"
                value={tecnologiaInput}
                onChange={(e) => setTecnologiaInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTecnologia();
                  }
                }}
                placeholder="Ej: React, Node.js, PostgreSQL..."
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTecnologia}
                disabled={isLoading}
              >
                Agregar
              </Button>
            </div>

            {/* Lista de tecnologías */}
            {formData.tecnologias && formData.tecnologias.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tecnologias.map((tech, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTecnologia(index)}
                      className="ml-1 hover:text-red-600"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comentarios */}
          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios Adicionales (opcional)</Label>
            <Textarea
              id="comentarios"
              name="comentarios"
              value={formData.comentarios}
              onChange={handleChange}
              placeholder="Agrega cualquier información adicional que consideres importante..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar Borrador'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
