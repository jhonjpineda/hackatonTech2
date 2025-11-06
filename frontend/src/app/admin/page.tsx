'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, User } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { Shield, Users, Calendar, Target, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getToken();

    if (!storedUser || !storedToken) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (storedUser.role !== 'ORGANIZADOR') {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
      return;
    }

    setUser(storedUser);
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user.nombres} {user.apellidos}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestión de Jueces */}
          <Link
            href="/admin/jueces"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestión de Jueces
                </h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Crear usuarios con rol de juez y asignarlos a hackathones
            </p>
            <div className="text-purple-600 font-medium flex items-center gap-2">
              Ir a Jueces →
            </div>
          </Link>

          {/* Hackathones */}
          <Link
            href="/hackathones"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Hackathones
                </h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Crear y gestionar hackathones, categorías y configuraciones
            </p>
            <div className="text-blue-600 font-medium flex items-center gap-2">
              Ir a Hackathones →
            </div>
          </Link>

          {/* Equipos */}
          <Link
            href="/equipos"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Equipos
                </h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Ver y gestionar todos los equipos registrados
            </p>
            <div className="text-green-600 font-medium flex items-center gap-2">
              Ir a Equipos →
            </div>
          </Link>

          {/* Desafíos */}
          <Link
            href="/desafios"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-orange-300 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Desafíos
                </h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Crear y gestionar desafíos para los hackathones
            </p>
            <div className="text-orange-600 font-medium flex items-center gap-2">
              Ir a Desafíos →
            </div>
          </Link>

          {/* Configuración */}
          <Link
            href="/settings"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-400 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Settings className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configuración
                </h2>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Configurar temas, rúbricas y otros ajustes del sistema
            </p>
            <div className="text-gray-600 font-medium flex items-center gap-2">
              Ir a Configuración →
            </div>
          </Link>
        </div>

        {/* Quick Access */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Acceso Rápido - Gestión de Jueces
          </h3>
          <p className="text-blue-700 mb-4">
            Para crear usuarios jueces y asignarlos a hackathones:
          </p>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>Ve a <strong>Gestión de Jueces</strong></li>
            <li>Haz clic en <strong>"Crear Juez"</strong></li>
            <li>Completa el formulario con los datos del juez</li>
            <li>Se generará una contraseña temporal automáticamente</li>
            <li>Luego asigna el juez a un hackathon desde la página del hackathon</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
