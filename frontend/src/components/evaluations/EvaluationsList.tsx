'use client';

import { Evaluation } from '@/services/evaluation.service';
import { Award, Star, MessageSquare, Calendar, User } from 'lucide-react';

interface EvaluationsListProps {
  evaluations: Evaluation[];
  showJudgeName?: boolean;
}

export function EvaluationsList({ evaluations, showJudgeName = false }: EvaluationsListProps) {
  if (evaluations.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">No hay evaluaciones para esta entrega aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation) => (
        <div
          key={evaluation.id}
          className="bg-brand-dark rounded-lg border border-brand-purple/20 p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-2">
                {evaluation.rubric?.nombre || 'Rúbrica'}
              </h4>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                {showJudgeName && evaluation.juez && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>
                      {evaluation.juez.nombres} {evaluation.juez.apellidos}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(evaluation.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {evaluation.rubric && (
                  <span className="px-2 py-0.5 bg-brand-purple/20 text-brand-cyan text-xs rounded-full border border-brand-purple/40">
                    {evaluation.rubric.porcentaje}% del total
                  </span>
                )}
              </div>

              {evaluation.rubric?.descripcion && (
                <p className="text-sm text-gray-400 italic mt-2">
                  "{evaluation.rubric.descripcion}"
                </p>
              )}
            </div>

            <div className="text-right ml-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="text-3xl font-bold text-white">
                  {evaluation.calificacion}
                </span>
                <span className="text-gray-400">
                  / {evaluation.rubric?.escalaMaxima || 100}
                </span>
              </div>
              <p className="text-sm text-brand-cyan mt-1 font-medium">
                {(
                  (Number(evaluation.calificacion) /
                    (evaluation.rubric?.escalaMaxima || 100)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>

          {evaluation.comentarios && (
            <div className="bg-brand-navy/50 rounded-lg p-4 border border-brand-purple/20 mt-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-brand-cyan mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-brand-cyan font-medium mb-1">
                    Comentarios del Juez:
                  </p>
                  <p className="text-sm text-gray-300">{evaluation.comentarios}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
