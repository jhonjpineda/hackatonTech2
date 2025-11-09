import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Organizer {
  id: string;
  documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  status: string;
  createdAt: string;
}

export interface CreateOrganizerData {
  documento: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
}

export interface CreateOrganizerResponse {
  user: Organizer;
  temporaryPassword: string;
}

export const organizerService = {
  /**
   * Crear un nuevo organizador
   */
  async create(data: CreateOrganizerData, token: string): Promise<CreateOrganizerResponse> {
    const response = await axios.post(
      `${API_URL}/auth/create-organizer`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Obtener todos los organizadores
   */
  async getAll(token: string): Promise<Organizer[]> {
    const response = await axios.get(`${API_URL}/auth/organizers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
