'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Shield, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Si el usuario no necesita cambiar contraseña, redirigir al dashboard
    if (user && !user.mustChangePassword) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword(
        user?.mustChangePassword ? undefined : formData.currentPassword,
        formData.newPassword
      );

      // Refrescar el usuario para actualizar mustChangePassword
      await refreshUser();

      toast.success('Contraseña actualizada exitosamente');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.mustChangePassword) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#12013e] to-[#1d1d3e] p-4">
      <Card className="w-full max-w-md bg-[#1d1d3e] border-[#b64cff]/30">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-[#b64cff]/20 flex items-center justify-center">
              <Shield className="h-8 w-8 text-[#b64cff]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Cambio de Contraseña Requerido
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Por seguridad, debes cambiar tu contraseña antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-200 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Nueva Contraseña
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                className={`bg-[#12013e] border-[#b64cff]/30 text-white placeholder:text-gray-500 ${
                  errors.newPassword ? 'border-red-500' : ''
                }`}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-400">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className={`bg-[#12013e] border-[#b64cff]/30 text-white placeholder:text-gray-500 ${
                  errors.confirmPassword ? 'border-red-500' : ''
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="bg-[#b64cff]/10 border border-[#b64cff]/30 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-300">
                💡 <strong>Consejo:</strong> Usa una combinación de letras mayúsculas, minúsculas,
                números y símbolos para una contraseña más segura.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#b64cff] hover:bg-[#b64cff]/80 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Actualizando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
