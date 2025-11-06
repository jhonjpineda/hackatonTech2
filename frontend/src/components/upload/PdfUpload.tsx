'use client';

import { useState, useRef } from 'react';
import { uploadService } from '@/services/upload.service';
import { Button } from '@/components/ui/Button';

interface PdfUploadProps {
  onUploadComplete: (url: string) => void;
  currentPdfUrl?: string;
  token: string;
  className?: string;
}

export function PdfUpload({
  onUploadComplete,
  currentPdfUrl,
  token,
  className = '',
}: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(currentPdfUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError('Por favor selecciona un archivo PDF');
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      setError('El PDF no debe superar los 10MB');
      return;
    }

    setError(null);
    setFileName(file.name);

    // Subir PDF
    setUploading(true);
    try {
      const response = await uploadService.uploadPdf(file, token);
      setPdfUrl(response.url);
      onUploadComplete(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el PDF');
      setPdfUrl(currentPdfUrl || null);
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPdfUrl(null);
    setFileName(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload"
          disabled={uploading}
        />
        <label htmlFor="pdf-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Subiendo...' : pdfUrl ? 'Cambiar PDF' : 'Seleccionar PDF'}
          </Button>
        </label>
        {pdfUrl && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={uploading}
          >
            Eliminar
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {pdfUrl && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileName || 'Archivo PDF'}
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver PDF
            </a>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Solo archivos PDF. Tamaño máximo: 10MB
      </p>
    </div>
  );
}
