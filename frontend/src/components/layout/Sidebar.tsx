'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Trophy,
  Users,
  FolderGit2,
  Award,
  Settings,
  LogOut,
  Code2,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Hackathones', href: '/hackathones', icon: Trophy },
  { name: 'Equipos', href: '/equipos', icon: Users },
  { name: 'Entregas', href: '/entregas', icon: FolderGit2 },
  { name: 'Desafíos', href: '/desafios', icon: Code2 },
  { name: 'Evaluaciones', href: '/evaluaciones', icon: Award },
];

const adminNavigation = [
  { name: 'Gestión de Jueces', href: '/admin/jueces', icon: Shield, rolesAllowed: ['ORGANIZADOR'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col bg-unicauca-navy border-r border-unicauca-dark">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-unicauca-dark">
        <Trophy className="h-8 w-8 text-unicauca-purple" />
        <span className="ml-2 text-xl font-bold text-white">HackatonTech2</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-unicauca-purple text-white shadow-lg'
                  : 'text-gray-300 hover:bg-unicauca-dark hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Navigation */}
        {user?.role === 'ORGANIZADOR' && (
          <>
            <div className="border-t border-unicauca-dark my-3"></div>
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-unicauca-lavender uppercase tracking-wider">
                Administración
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-unicauca-purple text-white shadow-lg'
                      : 'text-gray-300 hover:bg-unicauca-dark hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-unicauca-dark p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-unicauca-purple flex items-center justify-center text-white font-semibold">
            {user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.nombres} {user?.apellidos}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            {user?.interestTopics && user.interestTopics.length > 0 && (
              <p className="text-xs text-unicauca-cyan mt-1 truncate">
                {user.interestTopics[0].nombre}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-unicauca-dark hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-unicauca-dark hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
