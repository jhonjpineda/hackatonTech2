export interface SigaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SigaAuthResponse {
  token: string;
  expiresIn: number;
  refreshToken?: string;
}

export interface SigaReporte1003Response {
  usuarios: any[];
  total: number;
  page?: number;
  limit?: number;
}

export interface SigaValidationResult {
  isValid: boolean;
  user?: any;
  reason?: string;
  sigaData?: any;
}
