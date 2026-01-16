'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useUploadPhotos } from '@/hooks/use-photos';
import { toast } from 'sonner';

interface PhotoUploadProps {
  albumId: string;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function PhotoUpload({ albumId }: PhotoUploadProps) {
  const uploadPhotos = useUploadPhotos();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} excede o tamanho maximo de 10MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        await uploadPhotos.mutateAsync({ albumId, files: validFiles });
      }
    },
    [albumId, uploadPhotos]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    noClick: true,
    noKeyboard: true,
  });

  const handleClick = () => {
    if (!uploadPhotos.isPending) {
      open();
    }
  };

  return (
    <div
      {...getRootProps()}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${uploadPhotos.isPending ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? 'Solte as fotos aqui...'
          : uploadPhotos.isPending
          ? 'Enviando...'
          : 'Arraste fotos aqui ou clique para selecionar'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        JPG, PNG, GIF ou WebP. Maximo 10MB por arquivo.
      </p>
    </div>
  );
}
