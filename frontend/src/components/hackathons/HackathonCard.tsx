import React from 'react';
import Link from 'next/link';
import { Hackathon, HackathonStatus, HackathonMode } from '@/types/hackathon';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Monitor,
  Building2,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HackathonCardProps {
  hackathon: Hackathon;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
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
        <Building2 className="h-4 w-4 text-blue-600" />
      ),
      [HackathonMode.VIRTUAL]: <Monitor className="h-4 w-4 text-green-600" />,
      [HackathonMode.HIBRIDO]: <Globe className="h-4 w-4 text-purple-600" />,
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

  const statusBadge = getStatusBadge(hackathon.estado);

  return (
    <Link href={`/hackathones/${hackathon.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
        {/* Imagen */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
          {hackathon.urlImagen ? (
            <img
              src={hackathon.urlImagen}
              alt={hackathon.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Trophy className="h-16 w-16 text-white opacity-80" />
            </div>
          )}
          {/* Badge de estado */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
            >
              {statusBadge.text}
            </span>
          </div>
          {/* Badge de inscripción */}
          {hackathon.inscripcionAbierta && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                Inscripción Abierta
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5">
          {/* Título */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {hackathon.nombre}
          </h3>

          {/* Descripción corta */}
          {hackathon.descripcionCorta && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {hackathon.descripcionCorta}
            </p>
          )}

          {/* Información */}
          <div className="space-y-2">
            {/* Fechas */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(hackathon.fechaInicio), 'dd MMM yyyy', {
                  locale: es,
                })}{' '}
                -{' '}
                {format(new Date(hackathon.fechaFin), 'dd MMM yyyy', {
                  locale: es,
                })}
              </span>
            </div>

            {/* Modalidad */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {getModalidadIcon(hackathon.modalidad)}
              <span>{getModalidadText(hackathon.modalidad)}</span>
            </div>

            {/* Ubicación */}
            {hackathon.ubicacion && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{hackathon.ubicacion}</span>
              </div>
            )}

            {/* Capacidad */}
            {hackathon.maxParticipantes && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Hasta {hackathon.maxParticipantes} participantes</span>
              </div>
            )}
          </div>

          {/* Organizador */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Organizado por{' '}
              <span className="font-medium text-gray-700">
                {hackathon.organizador.nombres} {hackathon.organizador.apellidos}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
