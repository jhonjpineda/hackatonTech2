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
    <div className="min-h-screen bg-unicauca-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-300">
            Bienvenido, {user.nombres} {user.apellidos}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestión de Jueces */}
          <Link
            href="/admin/jueces"
            className="bg-unicauca-navy rounded-lg border border-unicauca-purple/30 p-6 hover:shadow-lg hover:border-unicauca-purple hover:shadow-unicauca-purple/20 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-unicauca-purple/20 rounded-lg">
                <Shield className="h-8 w-8 text-unicauca-purple" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Gestión de Jueces
                </h2>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Crear usuarios con rol de juez y asignarlos a hackathones
            </p>
            <div className="text-unicauca-purple font-medium flex items-center gap-2">
              Ir a Jueces →
            </div>
          </Link>

          {/* Hackathones */}
          <Link
            href="/hackathones"
            className="bg-unicauca-navy rounded-lg border border-unicauca-lavender/30 p-6 hover:shadow-lg hover:border-unicauca-lavender hover:shadow-unicauca-lavender/20 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-unicauca-lavender/20 rounded-lg">
                <Calendar className="h-8 w-8 text-unicauca-lavender" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Hackathones
                </h2>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Crear y gestionar hackathones, categorías y configuraciones
            </p>
            <div className="text-unicauca-lavender font-medium flex items-center gap-2">
              Ir a Hackathones →
            </div>
          </Link>

          {/* Equipos */}
          <Link
            href="/equipos"
            className="bg-unicauca-navy rounded-lg border border-unicauca-cyan/30 p-6 hover:shadow-lg hover:border-unicauca-cyan hover:shadow-unicauca-cyan/20 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-unicauca-cyan/20 rounded-lg">
                <Users className="h-8 w-8 text-unicauca-cyan" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Equipos
                </h2>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Ver y gestionar todos los equipos registrados
            </p>
            <div className="text-unicauca-cyan font-medium flex items-center gap-2">
              Ir a Equipos →
            </div>
          </Link>

          {/* Desafíos */}
          <Link
            href="/desafios"
            className="bg-unicauca-navy rounded-lg border border-unicauca-purple/30 p-6 hover:shadow-lg hover:border-unicauca-purple hover:shadow-unicauca-purple/20 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-unicauca-purple/20 rounded-lg">
                <Target className="h-8 w-8 text-unicauca-purple" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Desafíos
                </h2>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Crear y gestionar desafíos para los hackathones
            </p>
            <div className="text-unicauca-purple font-medium flex items-center gap-2">
              Ir a Desafíos →
            </div>
          </Link>

          {/* Configuración */}
          <Link
            href="/settings"
            className="bg-unicauca-navy rounded-lg border border-gray-500/30 p-6 hover:shadow-lg hover:border-gray-400 hover:shadow-gray-400/20 transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-500/20 rounded-lg">
                <Settings className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Configuración
                </h2>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Configurar temas, rúbricas y otros ajustes del sistema
            </p>
            <div className="text-gray-400 font-medium flex items-center gap-2">
              Ir a Configuración →
            </div>
          </Link>
        </div>

        {/* Quick Access */}
        <div className="mt-8 bg-unicauca-purple/10 border-l-4 border-unicauca-purple p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-unicauca-purple mb-2">
            Acceso Rápido - Gestión de Jueces
          </h3>
          <p className="text-gray-300 mb-4">
            Para crear usuarios jueces y asignarlos a hackathones:
          </p>
          <ol className="list-decimal list-inside text-gray-200 space-y-2">
            <li>Ve a <strong className="text-white">Gestión de Jueces</strong></li>
            <li>Haz clic en <strong className="text-white">"Crear Juez"</strong></li>
            <li>Completa el formulario con los datos del juez</li>
            <li>Se generará una contraseña temporal automáticamente</li>
            <li>Luego asigna el juez a un hackathon desde la página del hackathon</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
