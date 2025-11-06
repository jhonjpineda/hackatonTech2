'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { Trophy, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { sigaService, SigaUser } from '@/services/siga.service';
import { toast } from 'react-hot-toast';

type Step = 'documento' | 'verificar-codigo' | 'completar';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('documento');
  const [loading, setLoading] = useState(false);
  const [documento, setDocumento] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [sigaData, setSigaData] = useState<SigaUser | null>(null);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ============================================
  // PASO 1: Validar documento en SIGA y enviar email
  // ============================================
  const handleValidateDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documento.trim()) {
      setErrors({ documento: 'El documento es requerido' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Llamar al endpoint que valida en SIGA y envía email
      const response = await sigaService.registerWithSiga(documento);

      // Guardar email enmascarado
      setEmailMasked(response.email);

      // Avanzar al paso 2
      setStep('verificar-codigo');
      toast.success(response.message || '¡Código enviado a tu email!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al validar documento en SIGA';
      setErrors({ documento: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASO 2: Verificar código de email
  // ============================================
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setErrors({ code: 'El código es requerido' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Verificar código
      const response = await sigaService.verifyToken({
        token: verificationCode,
      });

      if (response.isValid && response.user) {
        // Convertir user a SigaUser format
        setSigaData({
          asp_codigo: 0,
          documento_numero: response.user.documento,
          tipo_documento: 'CC',
          nombres: response.user.nombres,
          apellidos: response.user.apellidos,
          correo_electronico: response.user.email,
          telefono_celular: '',
          fecha_nacimiento: '',
          programa_interes: response.user.interestTopics?.[0]?.nombre || '',
          inscripcion_aprobada: 'APROBADO',
        } as SigaUser);
        setStep('completar');
        toast.success('¡Código verificado! Completa tu registro');
      } else {
        throw new Error('Código inválido');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Código inválido o expirado';
      setErrors({ code: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASO 3: Completar registro con contraseña
  // ============================================
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    const newErrors: { [key: string]: string } = {};

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Completar registro
      await sigaService.completeRegistration({
        token: verificationCode,
        password: formData.password,
      });

      toast.success('¡Registro completado exitosamente!');

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al completar el registro';
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await sigaService.resendToken(documento);
      toast.success('¡Código reenviado a tu email!');
    } catch (error: any) {
      toast.error('Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {step === 'documento' && 'Verificación SIGA'}
            {step === 'verificar-codigo' && 'Verificar Email'}
            {step === 'completar' && 'Completar Registro'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'documento' && 'Ingresa tu documento para verificar tu inscripción en SIGA'}
            {step === 'verificar-codigo' && `Ingresa el código que enviamos a ${emailMasked}`}
            {step === 'completar' && 'Completa tu información para finalizar el registro'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* PASO 1: Ingresar documento */}
          {step === 'documento' && (
            <form onSubmit={handleValidateDocument} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documento">Documento de Identidad *</Label>
                <Input
                  id="documento"
                  name="documento"
                  type="text"
                  placeholder="Ej: 1234567890"
                  value={documento}
                  onChange={(e) => {
                    setDocumento(e.target.value);
                    if (errors.documento) {
                      setErrors({});
                    }
                  }}
                  disabled={loading}
                  className={errors.documento ? 'border-red-500' : ''}
                />
                {errors.documento && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.documento}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Verifica que tu documento esté registrado y aprobado en SIGA
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Verificando en SIGA...
                  </>
                ) : (
                  'Verificar Documento'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
          )}

          {/* PASO 2: Verificar código de email */}
          {step === 'verificar-codigo' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Código de verificación enviado
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Revisa tu bandeja de entrada en {emailMasked}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Código de Verificación *</Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  placeholder="Ej: 123456"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    if (errors.code) {
                      setErrors({});
                    }
                  }}
                  disabled={loading}
                  className={errors.code ? 'border-red-500' : ''}
                  maxLength={6}
                />
                {errors.code && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.code}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep('documento');
                    setVerificationCode('');
                    setErrors({});
                  }}
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Verificando...
                    </>
                  ) : (
                    'Verificar Código'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  ¿No recibiste el código? Reenviar
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: Completar registro */}
          {step === 'completar' && sigaData && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              {/* Información de SIGA (solo lectura) */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Documento verificado en SIGA</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre:</p>
                    <p className="font-medium">{sigaData.nombres} {sigaData.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Documento:</p>
                    <p className="font-medium">{sigaData.documento_numero}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email:</p>
                    <p className="font-medium">{sigaData.correo_electronico}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Programa:</p>
                    <p className="font-medium">{sigaData.programa_interes}</p>
                  </div>
                </div>
              </div>

              {/* Campos para completar */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1"
                />
                <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
                  Acepto los{' '}
                  <Link href="/terminos" className="text-primary hover:underline">
                    términos y condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link href="/privacidad" className="text-primary hover:underline">
                    política de privacidad
                  </Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500">{errors.acceptTerms}</p>
              )}

              {errors.general && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep('verificar-codigo');
                    setSigaData(null);
                    setFormData({ password: '', confirmPassword: '', acceptTerms: false });
                    setErrors({});
                  }}
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Completando...
                    </>
                  ) : (
                    'Completar Registro'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
