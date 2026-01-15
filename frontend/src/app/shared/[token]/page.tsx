'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Image, ExternalLink } from 'lucide-react';
import { albumsApi, api } from '@/lib/api';

interface SharedPhoto {
  id: string;
  title: string;
  description: string | null;
  fileKey: string;
  thumbnailKey: string | null;
  dominantColor: string;
  acquiredAt: string;
  sizeBytes: number;
}

interface SharedAlbum {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export default function SharedAlbumPage() {
  const params = useParams();
  const token = params.token as string;
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);
  const [page, setPage] = useState(1);

  // Fetch album info
  const { data: album, isLoading: albumLoading, error: albumError } = useQuery<SharedAlbum>({
    queryKey: ['shared-album', token],
    queryFn: async () => {
      const { data } = await albumsApi.getShared(token);
      return data;
    },
    enabled: !!token,
  });

  // Fetch photos - we need to create a custom fetch that doesn't require auth
  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['shared-photos', album?.id, page],
    queryFn: async () => {
      if (!album?.id) return null;
      // Note: In a real implementation, you'd have a public photos endpoint
      // For now, we'll simulate this with the photos API (which requires the gateway to allow public access)
      const { data } = await api.get(`/photos/album/${album.id}?page=${page}&limit=20`);
      return data;
    },
    enabled: !!album?.id,
  });

  // Fetch presigned URL for a photo
  const getPresignedUrl = async (key: string) => {
    try {
      const { data } = await api.get(`/upload/presigned/${encodeURIComponent(key)}`);
      return data.url;
    } catch {
      return null;
    }
  };

  if (albumError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Image className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Album nao encontrado</h1>
          <p className="text-gray-600 mb-4">
            Este link pode ter expirado ou o album nao esta mais compartilhado.
          </p>
          <Link href="/login">
            <Button>Fazer login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const photos: SharedPhoto[] = photosData?.data || [];
  const currentIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Album Compartilhado</span>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Criar minha conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {albumLoading ? (
          <div className="space-y-4 mb-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : album ? (
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{album.title}</h1>
            {album.description && (
              <p className="text-gray-600 mt-1">{album.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Criado em {new Date(album.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ) : null}

        {/* Photos Grid */}
        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Este album ainda nao tem fotos
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onClick={() => setSelectedPhoto(photo)}
                getPresignedUrl={getPresignedUrl}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {photosData && photosData.meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Pagina {page} de {photosData.meta.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(photosData.meta.totalPages, p + 1))}
              disabled={page === photosData.meta.totalPages}
            >
              Proxima
            </Button>
          </div>
        )}
      </main>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0" showCloseButton={true}>
          {selectedPhoto && (
            <PhotoViewer
              photo={selectedPhoto}
              photos={photos}
              currentIndex={currentIndex}
              onNavigate={(photo) => setSelectedPhoto(photo)}
              getPresignedUrl={getPresignedUrl}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Photo thumbnail component
function PhotoThumbnail({
  photo,
  onClick,
  getPresignedUrl,
}: {
  photo: SharedPhoto;
  onClick: () => void;
  getPresignedUrl: (key: string) => Promise<string | null>;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Load thumbnail URL
  useEffect(() => {
    if (photo.thumbnailKey) {
      getPresignedUrl(photo.thumbnailKey).then(setThumbnailUrl);
    }
  }, [photo.thumbnailKey, getPresignedUrl]);

  return (
    <div
      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      style={{ backgroundColor: photo.dominantColor }}
      onClick={onClick}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={photo.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}

// Photo viewer component
function PhotoViewer({
  photo,
  photos,
  currentIndex,
  onNavigate,
  getPresignedUrl,
}: {
  photo: SharedPhoto;
  photos: SharedPhoto[];
  currentIndex: number;
  onNavigate: (photo: SharedPhoto) => void;
  getPresignedUrl: (key: string) => Promise<string | null>;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load full image URL
  useEffect(() => {
    getPresignedUrl(photo.fileKey).then(setImageUrl);
  }, [photo.fileKey, getPresignedUrl]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(photos[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, photos, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(photos[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, photos, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  return (
    <>
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={photo.title}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      <div className="p-4 bg-white">
        <h3 className="font-semibold">{photo.title}</h3>
        {photo.description && (
          <p className="text-sm text-gray-600 mt-1">{photo.description}</p>
        )}
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span>Data: {new Date(photo.acquiredAt).toLocaleDateString('pt-BR')}</span>
          <span>Tamanho: {(photo.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>
    </>
  );
}
