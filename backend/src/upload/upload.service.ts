import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  /**
   * Get the full URL for an uploaded file
   */
  getFileUrl(filename: string): string {
    const backendUrl =
      this.configService.get('BACKEND_URL') || 'http://localhost:3001';
    return `${backendUrl}/uploads/${filename}`;
  }

  /**
   * Delete a file from the uploads directory
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join(process.cwd(), 'uploads', filename);
      await unlink(filePath);
    } catch (error) {
      throw new NotFoundException(
        `Archivo no encontrado o ya fue eliminado: ${filename}`,
      );
    }
  }

  /**
   * Extract filename from a full URL
   */
  extractFilename(url: string): string | null {
    if (!url) return null;
    const parts = url.split('/uploads/');
    return parts.length === 2 ? parts[1] : null;
  }

  /**
   * Validate file type by extension
   */
  isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  /**
   * Validate PDF file
   */
  isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }
}
