'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { teamService } from '@/services/team.service';
import { hackathonService } from '@/services/hackathonService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Hackathon } from '@/types/hackathon';

interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  hackathonId: string;
  topicId: string;
  activa: boolean;
}

export default function NuevoEquipoPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoryId: '',
  });

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    loadHackathonsAndCategories();
  }, [user, token]);

  const loadHackathonsAndCategories = async () => {
    if (!token) return;

    try {
      setLoadingData(true);
      // Obtener hackathones públicos con inscripción abierta
      const hackathonData = await hackathonService.getPublic();
      const openHackathons = hackathonData.filter(h => h.inscripcionAbierta);
      setHackathons(openHackathons);

      // Obtener categorías para cada hackathon
      const allCategories: Category[] = [];
      for (const hackathon of openHackathons) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories/hackathon/${hackathon.id}`
          );
          if (response.ok) {
            const hackathonCategories = await response.json();
            allCategories.push(...hackathonCategories.filter((c: Category) => c.activa));
          }
        } catch (err) {
          console.error(`Error loading categories for hackathon ${hackathon.id}:`, err);
        }
      }
      setCategories(allCategories);
    } catch (error) {
      console.error('Error al cargar hackathones:', error);
      toast.error('Error al cargar los hackathones disponibles');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre del equipo es obligatorio');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Debes seleccionar una categoría');
      return;
    }

    try {
      setLoading(true);
      const team = await teamService.create(formData, token);
      toast.success('Equipo creado exitosamente');
      router.push(`/equipos/${team.id}`);
    } catch (error: any) {
      console.error('Error al crear equipo:', error);
      toast.error(error.message || 'Error al crear el equipo');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/equipos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Equipo</h1>
            <p className="text-gray-600 mt-1">
              Forma tu equipo para participar en un hackathon
            </p>
          </div>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Información del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre del equipo */}
              <div>
                <Label htmlFor="nombre">
                  Nombre del Equipo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Los Innovadores"
                  required
                  maxLength={50}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.nombre.length}/50 caracteres
                </p>
              </div>

              {/* Descripción */}
              <div>
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe brevemente tu equipo..."
                  rows={4}
                  maxLength={500}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.descripcion.length}/500 caracteres
                </p>
              </div>

              {/* Selección de Categoría */}
              <div>
                <Label htmlFor="categoryId">
                  Categoría del Hackathon <span className="text-red-500">*</span>
                </Label>
                {loadingData ? (
                  <div className="mt-1 p-3 border border-gray-300 rounded-lg text-gray-500">
                    Cargando categorías disponibles...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="mt-1 p-3 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-800">
                    No hay categorías disponibles. Verifica que haya hackathones con inscripción abierta.
                  </div>
                ) : (
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una categoría</option>
                    {hackathons.map((hackathon) => {
                      const hackathonCategories = categories.filter(c => c.hackathonId === hackathon.id);
                      if (hackathonCategories.length === 0) return null;
                      return (
                        <optgroup key={hackathon.id} label={hackathon.nombre}>
                          {hackathonCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.nombre}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona la categoría según tu tema de interés en el hackathon
                </p>
              </div>

              {/* Info adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  ℹ️ Información importante
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Serás el líder del equipo automáticamente</li>
                  <li>• Podrás invitar a otros participantes después de crear el equipo</li>
                  <li>• El equipo se asignará al hackathon seleccionado</li>
                  <li>• Podrás editar la información del equipo más tarde</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/equipos')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || categories.length === 0}
                  className="flex-1"
                >
                  {loading ? 'Creando...' : 'Crear Equipo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Ayuda */}
        <Card className="bg-gray-50">
          <CardContent className="py-4">
            <h3 className="font-medium text-gray-900 mb-2">¿Necesitas ayuda?</h3>
            <p className="text-sm text-gray-600">
              Si tienes problemas para crear tu equipo o necesitas invitar a otros miembros,
              puedes contactar al organizador del hackathon desde la página del evento.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
