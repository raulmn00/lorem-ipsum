'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Check, Loader2 } from 'lucide-react';
import { Album, useSetAlbumThumbnail } from '@/hooks/use-albums';
import { usePhotos, Photo } from '@/hooks/use-photos';
import { uploadApi } from '@/lib/api';
import { toast } from 'sonner';

interface AlbumCoverModalProps {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function AlbumCoverModal({ album, open, onOpenChange }: AlbumCoverModalProps) {
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const setThumbnail = useSetAlbumThumbnail();

  const { data: photosData, isLoading } = usePhotos(album?.id || '', 1, 50);

  // Load presigned URLs for photos
  useEffect(() => {
    if (!photosData?.data) return;

    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const photo of photosData.data) {
        const key = photo.thumbnailKey || photo.fileKey;
        try {
          const { data } = await uploadApi.getPresignedUrl(key);
          urls[photo.id] = data.url;
        } catch {
          // Ignore errors
        }
      }
      setPhotoUrls(urls);
    };

    loadUrls();
  }, [photosData?.data]);

  const handleSelectPhoto = async (photo: Photo) => {
    if (!album) return;

    const thumbnailKey = photo.thumbnailKey || photo.fileKey;
    await setThumbnail.mutateAsync({ albumId: album.id, thumbnailKey });
    onOpenChange(false);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || !album) return;

      const file = acceptedFiles[0];
      if (file.size > MAX_SIZE) {
        toast.error('Arquivo excede o tamanho maximo de 10MB');
        return;
      }

      setIsUploading(true);
      try {
        // Upload the photo first
        const { data } = await uploadApi.uploadPhotos(album.id, [file]);

        // Use the uploaded photo's key as thumbnail
        if (data.photos && data.photos.length > 0) {
          const uploadedPhoto = data.photos[0];
          const thumbnailKey = uploadedPhoto.thumbnailKey || uploadedPhoto.fileKey;
          await setThumbnail.mutateAsync({ albumId: album.id, thumbnailKey });
          onOpenChange(false);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erro ao fazer upload');
      } finally {
        setIsUploading(false);
      }
    },
    [album, setThumbnail, onOpenChange]
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    fileRejections.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          const sizeMB = (file.size / 1024 / 1024).toFixed(1);
          toast.error(`${file.name} (${sizeMB}MB) excede o tamanho maximo de 10MB`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} nao e um tipo de arquivo suportado`);
        } else {
          toast.error(`Erro ao processar ${file.name}: ${error.message}`);
        }
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const handleDropzoneClick = () => {
    if (!isUploading) {
      openFilePicker();
    }
  };

  if (!album) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Definir capa do album</DialogTitle>
        </DialogHeader>

        {/* Drag and drop area */}
        <div
          {...getRootProps()}
          onClick={handleDropzoneClick}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Solte a foto aqui...'
              : isUploading
              ? 'Enviando...'
              : 'Arraste uma foto ou clique para enviar uma nova capa'}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 border-t" />
          <span className="text-sm text-gray-500">ou selecione uma foto existente</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Photos grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : photosData?.data && photosData.data.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {photosData.data.map((photo) => {
                const isCurrentCover = album.thumbnailKey === photo.thumbnailKey ||
                                       album.thumbnailKey === photo.fileKey;
                return (
                  <button
                    key={photo.id}
                    onClick={() => handleSelectPhoto(photo)}
                    disabled={setThumbnail.isPending}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                      hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isCurrentCover ? 'border-blue-500' : 'border-transparent'}
                      ${setThumbnail.isPending ? 'opacity-50' : ''}
                    `}
                  >
                    {photoUrls[photo.id] ? (
                      <img
                        src={photoUrls[photo.id]}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {isCurrentCover && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma foto neste album.</p>
              <p className="text-sm mt-1">Arraste uma foto acima para definir como capa.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
