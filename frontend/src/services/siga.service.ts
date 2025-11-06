import axiosInstance from '@/lib/axios';

export interface SigaUser {
  asp_codigo: number;
  documento_numero: string;
  tipo_documento: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono_celular: string;
  fecha_nacimiento: string;
  programa_interes: string;
  inscripcion_aprobada: string;
  // ... otros campos de SIGA
}

export interface RegisterSigaResponse {
  message: string;
  email: string;
}

export interface VerifyTokenData {
  token: string;
}

export interface VerifyTokenResponse {
  isValid: boolean;
  user?: {
    documento: string;
    nombres: string;
    apellidos: string;
    email: string;
    interestTopics?: any[];
  };
}

export interface CompleteRegistrationData {
  token: string;
  password: string;
  interestTopicIds?: string[];
}

class SigaService {
  /**
   * Paso 1: Validar documento en SIGA y enviar código por email
   */
  async registerWithSiga(documento: string): Promise<RegisterSigaResponse> {
    const response = await axiosInstance.post<RegisterSigaResponse>(
      '/auth/register/siga',
      { documento }
    );
    return response.data;
  }

  /**
   * Paso 2: Verificar código de email
   */
  async verifyToken(data: VerifyTokenData): Promise<VerifyTokenResponse> {
    const response = await axiosInstance.post<VerifyTokenResponse>(
      '/auth/verify-token',
      data
    );
    return response.data;
  }

  /**
   * Paso 3: Completar el registro con contraseña
   */
  async completeRegistration(data: CompleteRegistrationData) {
    const response = await axiosInstance.post('/auth/complete-registration', data);

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }

    return response.data;
  }

  /**
   * Validar si un documento existe en SIGA
   */
  async validateDocument(documento: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await axiosInstance.post('/siga/validate', { documento });
      return response.data;
    } catch (error: any) {
      return {
        valid: false,
        message: error.response?.data?.message || 'Error al validar documento'
      };
    }
  }

  /**
   * Reenviar token de verificación
   */
  async resendToken(documento: string): Promise<void> {
    await axiosInstance.post(`/auth/resend-token/${documento}`);
  }
}

export const sigaService = new SigaService();
