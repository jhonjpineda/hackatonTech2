'use client';

import { useState } from 'react';
import { evaluationService } from '@/services/evaluation.service';
import toast from 'react-hot-toast';
import { Star, MessageSquare, Save, X } from 'lucide-react';

interface Rubric {
  id: string;
  nombre: string;
  descripcion?: string;
  escalaMinima: number;
  escalaMaxima: number;
  porcentaje: number;
}

interface EvaluationFormProps {
  rubric: Rubric;
  teamId: string;
  submissionId: string;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
  existingEvaluation?: {
    id: string;
    calificacion: number;
    comentarios?: string;
  };
}

export function EvaluationForm({
  rubric,
  teamId,
  submissionId,
  token,
  onSuccess,
  onCancel,
  existingEvaluation,
}: EvaluationFormProps) {
  const [calificacion, setCalificacion] = useState(
    existingEvaluation?.calificacion.toString() || ''
  );
  const [comentarios, setComentarios] = useState(existingEvaluation?.comentarios || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const score = Number(calificacion);

    // Validaciones
    if (!calificacion || isNaN(score)) {
      toast.error('Ingresa una calificación válida');
      return;
    }

    if (score < rubric.escalaMinima || score > rubric.escalaMaxima) {
      toast.error(
        `La calificación debe estar entre ${rubric.escalaMinima} y ${rubric.escalaMaxima}`
      );
      return;
    }

    try {
      setLoading(true);

      if (existingEvaluation) {
        // Actualizar evaluación existente
        await evaluationService.update(
          existingEvaluation.id,
          {
            calificacion: score,
            comentarios: comentarios.trim() || undefined,
          },
          token
        );
        toast.success('Evaluación actualizada exitosamente');
      } else {
        // Crear nueva evaluación
        await evaluationService.create(
          {
            rubricId: rubric.id,
            teamId,
            submissionId,
            calificacion: score,
            comentarios: comentarios.trim() || undefined,
          },
          token
        );
        toast.success('Evaluación creada exitosamente');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar evaluación:', error);
      toast.error(error.message || 'Error al guardar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const percentage = calificacion
    ? ((Number(calificacion) / rubric.escalaMaxima) * 100).toFixed(1)
    : '0';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-brand-purple/10 border-l-4 border-brand-purple p-4 rounded-r-lg">
        <h3 className="text-lg font-semibold text-white mb-1">{rubric.nombre}</h3>
        {rubric.descripcion && (
          <p className="text-sm text-gray-300 italic">{rubric.descripcion}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-1 bg-brand-purple/20 text-brand-cyan text-xs rounded-full border border-brand-purple/40">
            {rubric.porcentaje}% del total
          </span>
          <span className="text-xs text-gray-400">
            Escala: {rubric.escalaMinima} - {rubric.escalaMaxima}
          </span>
        </div>
      </div>

      {/* Calificación */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Calificación <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={rubric.escalaMinima}
            max={rubric.escalaMaxima}
            step="0.01"
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
            placeholder={`${rubric.escalaMinima} - ${rubric.escalaMaxima}`}
            className="w-32 px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple text-center text-xl font-bold"
            required
          />
          <span className="text-gray-400">/ {rubric.escalaMaxima}</span>

          {calificacion && (
            <div className="flex items-center gap-2 ml-4">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-bold text-brand-cyan">{percentage}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ingresa un valor entre {rubric.escalaMinima} y {rubric.escalaMaxima}
        </p>
      </div>

      {/* Comentarios */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentarios (Opcional)
          </div>
        </label>
        <textarea
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Proporciona retroalimentación constructiva al equipo..."
          rows={4}
          className="w-full px-4 py-2 bg-brand-dark border border-brand-purple/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple resize-none"
        />
        <p className="text-xs text-gray-500 mt-2">
          Los comentarios ayudan al equipo a mejorar su trabajo
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-brand-purple/20">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </div>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading
              ? 'Guardando...'
              : existingEvaluation
              ? 'Actualizar Evaluación'
              : 'Guardar Evaluación'}
          </div>
        </button>
      </div>
    </form>
  );
}
