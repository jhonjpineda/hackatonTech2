import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from './StatusBadge';
import { Submission, SubmissionStatus } from '@/types/submission';

interface SubmissionCardProps {
  submission: Submission;
  showTeamInfo?: boolean;
  showChallengeInfo?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSubmit?: (id: string) => void;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  showTeamInfo = false,
  showChallengeInfo = false,
  onView,
  onEdit,
  onDelete,
  onSubmit,
}) => {
  const canEdit = submission.status === SubmissionStatus.DRAFT;
  const canSubmit = submission.status === SubmissionStatus.DRAFT;
  const canDelete = submission.status === SubmissionStatus.DRAFT;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tecnologias = submission.tecnologiasArray ||
    (submission.tecnologias ? JSON.parse(submission.tecnologias) : []);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold mb-2">
              {submission.titulo}
            </CardTitle>
            {showTeamInfo && submission.team && (
              <CardDescription className="text-sm">
                Equipo: {submission.team.nombre}
              </CardDescription>
            )}
            {showChallengeInfo && submission.challenge && (
              <CardDescription className="text-sm">
                Reto: {submission.challenge.titulo}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {submission.descripcion}
        </p>

        {/* Tecnologías */}
        {tecnologias.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tecnologias.slice(0, 5).map((tech: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded"
              >
                {tech}
              </span>
            ))}
            {tecnologias.length > 5 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{tecnologias.length - 5} más
              </span>
            )}
          </div>
        )}

        {/* Enlaces */}
        <div className="flex flex-wrap gap-2 text-xs">
          {submission.repositorioUrl && (
            <a
              href={submission.repositorioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              📁 Repositorio
            </a>
          )}
          {submission.demoUrl && (
            <a
              href={submission.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              🌐 Demo
            </a>
          )}
          {submission.videoUrl && (
            <a
              href={submission.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              🎥 Video
            </a>
          )}
        </div>

        {/* Puntaje */}
        {submission.puntajeFinal && (
          <div className="pt-2 border-t">
            <span className="text-sm font-semibold">
              Puntaje: {Number(submission.puntajeFinal).toFixed(2)} / 100
            </span>
          </div>
        )}

        {/* Fecha de envío */}
        {submission.submittedAt && (
          <div className="text-xs text-gray-500">
            Enviada: {formatDate(submission.submittedAt)}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        {onView && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(submission.id)}
          >
            Ver Detalle
          </Button>
        )}

        {canEdit && onEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(submission.id)}
          >
            Editar
          </Button>
        )}

        {canSubmit && onSubmit && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onSubmit(submission.id)}
          >
            Enviar Entrega
          </Button>
        )}

        {canDelete && onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(submission.id)}
          >
            Eliminar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
