export interface UploadResponse {
  filename: string;
  url: string;
  mimetype: string;
  size: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const uploadService = {
  // Subir una imagen
  async uploadImage(file: File, token: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir la imagen');
    }

    return response.json();
  },

  // Subir un PDF
  async uploadPdf(file: File, token: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload/pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al subir el PDF');
    }

    return response.json();
  },

  // Eliminar un archivo
  async deleteFile(filename: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/upload/${filename}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar el archivo');
    }
  },
};
